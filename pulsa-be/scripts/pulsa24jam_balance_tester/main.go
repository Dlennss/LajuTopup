package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"pulsa2/config"
	"pulsa2/internal/provider"
)

const providerName = "pulsa24jam"

func main() {
	var (
		envFile = flag.String("env", "", "path ke env file, contoh /path/backend.env")
		syncDB  = flag.Bool("sync", false, "samakan dompet_provider dengan saldo live Pulsa24Jam")
		note    = flag.String("note", "sync saldo live Pulsa24Jam", "catatan mutasi saat --sync")
	)
	flag.Parse()

	if strings.TrimSpace(*envFile) != "" {
		if err := godotenv.Load(*envFile); err != nil {
			log.Fatalf("load env file: %v", err)
		}
	}

	cfg := config.Load()
	ctx, cancel := context.WithTimeout(context.Background(), cfg.Pulsa24JamTimeout+10*time.Second)
	defer cancel()

	p24 := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{
		BaseURL:  cfg.Pulsa24JamBaseURL,
		MemberID: cfg.Pulsa24JamMemberID,
		APIKey:   cfg.Pulsa24JamAPIKey,
		PIN:      cfg.Pulsa24JamPIN,
		Timeout:  cfg.Pulsa24JamTimeout,
	})
	live, err := p24.Balance(ctx)
	if err != nil {
		log.Fatalf("cek saldo Pulsa24Jam: %v", err)
	}

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping db: %v", err)
	}

	before, after, direction, amount, changed, err := compareOrSync(ctx, db, live.Balance, *syncDB, *note)
	if err != nil {
		log.Fatalf("sync saldo internal: %v", err)
	}

	result := map[string]any{
		"ok":                      true,
		"mode":                    map[bool]string{true: "sync", false: "dry-run"}[*syncDB],
		"provider":                providerName,
		"pulsa24jam_http_status":  live.HTTPStatus,
		"pulsa24jam_command":      live.Command,
		"pulsa24jam_live_balance": live.Balance,
		"internal_before":         before,
		"internal_after":          after,
		"diff":                    live.Balance - before,
		"changed":                 changed,
	}
	if amount > 0 {
		result["adjustment_direction"] = direction
		result["adjustment_amount"] = amount
	}

	enc, _ := json.MarshalIndent(result, "", "  ")
	fmt.Println(string(enc))
}

func compareOrSync(ctx context.Context, db *sql.DB, liveBalance int64, syncDB bool, note string) (before, after int64, direction string, amount int64, changed bool, err error) {
	tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return 0, 0, "", 0, false, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.ExecContext(ctx, `
INSERT INTO public.dompet_provider (provider, saldo)
VALUES ($1, 0)
ON CONFLICT (provider) DO NOTHING
`, providerName); err != nil {
		return 0, 0, "", 0, false, err
	}

	if err = tx.QueryRowContext(ctx, `
SELECT saldo
FROM public.dompet_provider
WHERE provider = $1
FOR UPDATE
`, providerName).Scan(&before); err != nil {
		return 0, 0, "", 0, false, err
	}

	after = before
	diff := liveBalance - before
	if diff == 0 {
		if err = tx.Commit(); err != nil {
			return 0, 0, "", 0, false, err
		}
		return before, after, "", 0, false, nil
	}

	if diff > 0 {
		direction = "credit"
		amount = diff
	} else {
		direction = "debit"
		amount = -diff
	}

	if !syncDB {
		if err = tx.Commit(); err != nil {
			return 0, 0, "", 0, false, err
		}
		return before, after, direction, amount, false, nil
	}

	after = liveBalance
	refID := fmt.Sprintf("P24BAL-%s", time.Now().UTC().Format("20060102150405"))
	meta, _ := json.Marshal(map[string]any{
		"source":       "pulsa24jam_balance_tester",
		"live_balance": liveBalance,
	})

	if _, err = tx.ExecContext(ctx, `
UPDATE public.dompet_provider
SET saldo = $2, diperbarui_pada = now()
WHERE provider = $1
`, providerName, after); err != nil {
		return 0, 0, "", 0, false, err
	}

	if _, err = tx.ExecContext(ctx, `
INSERT INTO public.mutasi_dompet_provider
  (provider, ref_id, arah, jumlah, alasan, catatan, saldo_sebelum, saldo_sesudah, dibuat_pada, meta)
VALUES
  ($1, $2, $3, $4, 'PULSA24JAM_BALANCE_SYNC', $5, $6, $7, now(), $8::jsonb)
`, providerName, refID, direction, amount, note, before, after, string(meta)); err != nil {
		return 0, 0, "", 0, false, err
	}

	if err = tx.Commit(); err != nil {
		return 0, 0, "", 0, false, err
	}
	return before, after, direction, amount, true, nil
}
