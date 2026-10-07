package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"embed"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
)

//go:embed sql/20260921_seed_pulsa24jam_h2hr_dashboard_products.sql
var pulsa24JamCatalogSeedFS embed.FS

const pulsa24JamCatalogSeedPath = "sql/20260921_seed_pulsa24jam_h2hr_dashboard_products.sql"

func applyPulsa24JamCatalogSeed(db *sql.DB) {
	if strings.EqualFold(strings.TrimSpace(os.Getenv("PULSA24JAM_CATALOG_SEED_AUTO_SYNC")), "false") {
		log.Printf("pulsa24jam catalog seed auto-sync disabled")
		return
	}

	seedSQL, err := pulsa24JamCatalogSeedFS.ReadFile(pulsa24JamCatalogSeedPath)
	if err != nil {
		log.Fatalf("read pulsa24jam catalog seed: %v", err)
	}
	seedHash := fmt.Sprintf("%x", sha256.Sum256(seedSQL))

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	conn, err := db.Conn(ctx)
	if err != nil {
		log.Fatalf("pulsa24jam catalog seed db conn: %v", err)
	}
	defer conn.Close()

	if _, err := conn.ExecContext(ctx, `SELECT pg_advisory_lock(2409202601)`); err != nil {
		log.Fatalf("pulsa24jam catalog seed lock: %v", err)
	}
	defer func() {
		if _, err := conn.ExecContext(context.Background(), `SELECT pg_advisory_unlock(2409202601)`); err != nil {
			log.Printf("pulsa24jam catalog seed unlock warning: %v", err)
		}
	}()

	if _, err := conn.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS public.app_catalog_seed_history (
  seed_name TEXT NOT NULL,
  seed_sha TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (seed_name, seed_sha)
)`); err != nil {
		log.Fatalf("pulsa24jam catalog seed history table: %v", err)
	}

	var exists bool
	if err := conn.QueryRowContext(ctx, `
SELECT EXISTS (
  SELECT 1
  FROM public.app_catalog_seed_history
  WHERE seed_name = 'pulsa24jam_h2hr_dashboard_products'
    AND seed_sha = $1
)`, seedHash).Scan(&exists); err != nil {
		log.Fatalf("pulsa24jam catalog seed history check: %v", err)
	}
	if exists {
		log.Printf("pulsa24jam catalog seed already applied sha=%s", seedHash[:12])
		return
	}

	log.Printf("applying pulsa24jam catalog seed sha=%s", seedHash[:12])
	if _, err := conn.ExecContext(ctx, string(seedSQL)); err != nil {
		log.Fatalf("apply pulsa24jam catalog seed: %v", err)
	}
	if _, err := conn.ExecContext(ctx, `
INSERT INTO public.app_catalog_seed_history (seed_name, seed_sha)
VALUES ('pulsa24jam_h2hr_dashboard_products', $1)
ON CONFLICT DO NOTHING`, seedHash); err != nil {
		log.Fatalf("record pulsa24jam catalog seed history: %v", err)
	}
	log.Printf("pulsa24jam catalog seed applied sha=%s", seedHash[:12])
}
