package repository

import (
	"context"
	"database/sql"
	"strings"
)

type AppProdukRepository struct {
	db *sql.DB
}

func NewAppProdukRepository(db *sql.DB) *AppProdukRepository {
	return &AppProdukRepository{db: db}
}

func (r *AppProdukRepository) List(ctx context.Context, q string, kategoriID, brandID int64) ([]AppProdukRow, error) {
	q = strings.TrimSpace(q)
	rows, err := r.db.QueryContext(ctx, `
WITH app_prices AS (
  SELECT DISTINCT ON (a.produk_id)
    a.produk_id,
    a.harga
  FROM public.produk_app_pricing a
  WHERE a.aktif = true
    AND LOWER(TRIM(a.provider)) = 'pulsa24jam'
  ORDER BY
    a.produk_id,
    a.harga ASC,
    a.id DESC
),
open_brands AS (
  SELECT DISTINCT p_open.kategori_id, p_open.brand_id
  FROM public.produk p_open
  JOIN app_prices app_open ON app_open.produk_id = p_open.id
  WHERE p_open.aktif = true
    AND p_open.tipe_harga::text = 'OPEN_AMOUNT'
),
open_best AS (
  SELECT id
  FROM (
    SELECT
      p_best.id,
      ROW_NUMBER() OVER (
        PARTITION BY p_best.kategori_id, p_best.brand_id
        ORDER BY
          CASE
            WHEN UPPER(p_best.nama) LIKE '%OPEN AMOUNT%' THEN 0
            WHEN UPPER(TRIM(p_best.sku)) = UPPER(regexp_replace(COALESCE(b_best.nama, ''), '[^A-Za-z0-9]', '', 'g')) THEN 1
            WHEN UPPER(p_best.nama) LIKE '%DENOM BEBAS%'
              AND UPPER(p_best.nama) NOT LIKE '%[ELEKTRIK]%'
              AND UPPER(p_best.nama) NOT LIKE '%DRIVER%'
              AND UPPER(p_best.nama) NOT LIKE '%BANK%'
              AND UPPER(p_best.nama) NOT LIKE '%NOMINAL@NOHP%' THEN 2
            WHEN UPPER(p_best.nama) LIKE '%DENOM BEBAS%' THEN 4
            WHEN UPPER(p_best.nama) LIKE '%NOMINAL@NOHP%' THEN 7
            WHEN UPPER(p_best.nama) LIKE '%PROMO%' THEN 8
            WHEN UPPER(p_best.nama) LIKE '%DRIVER%' THEN 9
            ELSE 6
          END ASC,
          app_best.harga ASC,
          LENGTH(p_best.nama) ASC,
          p_best.id DESC
      ) AS rn
    FROM public.produk p_best
    JOIN app_prices app_best ON app_best.produk_id = p_best.id
    LEFT JOIN public.brand b_best ON b_best.id = p_best.brand_id
    WHERE p_best.aktif = true
      AND p_best.tipe_harga::text = 'OPEN_AMOUNT'
  ) ranked_open
  WHERE rn = 1
)
SELECT
  p.id,
  p.sku,
  p.nama,
  COALESCE(p.group_name, ''),
  p.kategori_id,
  COALESCE(k.nama, ''),
  p.brand_id,
  COALESCE(b.nama, ''),
  p.tipe_harga::text,
  COALESCE(app.harga, 0),
  p.nominal,
  p.maksimal_nominal,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN COALESCE(kfa_open.fee_master, COALESCE(kfa.fee_master, 0))
    ELSE COALESCE(kfa.fee_master, 0)
  END AS fee_master,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN COALESCE(kfa_open.fee_agent, COALESCE(kfa.fee_agent, 0))
    ELSE COALESCE(kfa.fee_agent, 0)
  END AS fee_agent,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN COALESCE(kfa_open.fee_user, COALESCE(kfa.fee_user, 0))
    ELSE COALESCE(kfa.fee_user, 0)
  END AS fee_user,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN COALESCE(kfa_open.fee_non_user, COALESCE(kfa.fee_non_user, 0))
    ELSE COALESCE(kfa.fee_non_user, 0)
  END AS fee_guest,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN app.harga + COALESCE(kfa_open.fee_master, COALESCE(kfa.fee_master, 0))
    ELSE app.harga + COALESCE(kfa.fee_master, 0)
  END AS harga_master_final,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN app.harga + COALESCE(kfa_open.fee_agent, COALESCE(kfa.fee_agent, 0))
    ELSE app.harga + COALESCE(kfa.fee_agent, 0)
  END AS harga_agent_final,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN app.harga + COALESCE(kfa_open.fee_user, COALESCE(kfa.fee_user, 0))
    ELSE app.harga + COALESCE(kfa.fee_user, 0)
  END AS harga_user_final,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN app.harga + COALESCE(kfa_open.fee_non_user, COALESCE(kfa.fee_non_user, 0))
    ELSE app.harga + COALESCE(kfa.fee_non_user, 0)
  END AS harga_guest_final,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN ((app.harga + COALESCE(kfa_open.fee_master, COALESCE(kfa.fee_master, 0))) * 7 + 999) / 1000
    ELSE ((app.harga + COALESCE(kfa.fee_master, 0)) * 7 + 999) / 1000
  END AS payment_fee_master,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN ((app.harga + COALESCE(kfa_open.fee_agent, COALESCE(kfa.fee_agent, 0))) * 7 + 999) / 1000
    ELSE ((app.harga + COALESCE(kfa.fee_agent, 0)) * 7 + 999) / 1000
  END AS payment_fee_agent,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN ((app.harga + COALESCE(kfa_open.fee_user, COALESCE(kfa.fee_user, 0))) * 7 + 999) / 1000
    ELSE ((app.harga + COALESCE(kfa.fee_user, 0)) * 7 + 999) / 1000
  END AS payment_fee_user,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN ((app.harga + COALESCE(kfa_open.fee_non_user, COALESCE(kfa.fee_non_user, 0))) * 7 + 999) / 1000
    ELSE ((app.harga + COALESCE(kfa.fee_non_user, 0)) * 7 + 999) / 1000
  END AS payment_fee_guest,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN (app.harga + COALESCE(kfa_open.fee_master, COALESCE(kfa.fee_master, 0))) + (((app.harga + COALESCE(kfa_open.fee_master, COALESCE(kfa.fee_master, 0))) * 7 + 999) / 1000)
    ELSE (app.harga + COALESCE(kfa.fee_master, 0)) + (((app.harga + COALESCE(kfa.fee_master, 0)) * 7 + 999) / 1000)
  END AS harga_master_with_payment_fee_final,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN (app.harga + COALESCE(kfa_open.fee_agent, COALESCE(kfa.fee_agent, 0))) + (((app.harga + COALESCE(kfa_open.fee_agent, COALESCE(kfa.fee_agent, 0))) * 7 + 999) / 1000)
    ELSE (app.harga + COALESCE(kfa.fee_agent, 0)) + (((app.harga + COALESCE(kfa.fee_agent, 0)) * 7 + 999) / 1000)
  END AS harga_agent_with_payment_fee_final,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN (app.harga + COALESCE(kfa_open.fee_user, COALESCE(kfa.fee_user, 0))) + (((app.harga + COALESCE(kfa_open.fee_user, COALESCE(kfa.fee_user, 0))) * 7 + 999) / 1000)
    ELSE (app.harga + COALESCE(kfa.fee_user, 0)) + (((app.harga + COALESCE(kfa.fee_user, 0)) * 7 + 999) / 1000)
  END AS harga_user_with_payment_fee_final,
  CASE
    WHEN p.tipe_harga::text = 'FIXED' AND COALESCE(app.harga, 0) <= 0 THEN 0
    WHEN p.tipe_harga::text = 'OPEN_AMOUNT' THEN (app.harga + COALESCE(kfa_open.fee_non_user, COALESCE(kfa.fee_non_user, 0))) + (((app.harga + COALESCE(kfa_open.fee_non_user, COALESCE(kfa.fee_non_user, 0))) * 7 + 999) / 1000)
    ELSE (app.harga + COALESCE(kfa.fee_non_user, 0)) + (((app.harga + COALESCE(kfa.fee_non_user, 0)) * 7 + 999) / 1000)
  END AS harga_guest_with_payment_fee_final,
  p.aktif,
  p.dibuat_pada,
  p.diubah_pada
FROM public.produk p
JOIN app_prices app ON app.produk_id = p.id
LEFT JOIN public.kategori_fee_app kfa
  ON kfa.kategori_id = p.kategori_id
 AND kfa.aktif = true
LEFT JOIN public.kategori k_open
  ON LOWER(k_open.nama) = LOWER('Bebas Nominal')
LEFT JOIN public.kategori_fee_app kfa_open
  ON kfa_open.kategori_id = k_open.id
 AND kfa_open.aktif = true
LEFT JOIN public.kategori k ON k.id = p.kategori_id
LEFT JOIN public.brand b ON b.id = p.brand_id
WHERE p.aktif = true
  AND ($1 = '' OR p.sku ILIKE '%'||$1||'%' OR p.nama ILIKE '%'||$1||'%')
  AND ($2 <= 0 OR p.kategori_id = $2)
  AND ($3 <= 0 OR p.brand_id = $3)
  AND (
    (
      p.tipe_harga::text = 'OPEN_AMOUNT'
      AND p.id IN (SELECT id FROM open_best)
    )
    OR (
      p.tipe_harga::text <> 'OPEN_AMOUNT'
      AND NOT EXISTS (
      SELECT 1
      FROM open_brands ob
      WHERE ob.kategori_id = p.kategori_id
        AND ob.brand_id = p.brand_id
      )
    )
  )
ORDER BY COALESCE(app.harga, 0) ASC,
         p.id DESC
`, q, kategoriID, brandID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]AppProdukRow, 0, 128)
	for rows.Next() {
		var (
			row                    AppProdukRow
			nominal                sql.NullInt64
			maxNominal             sql.NullInt64
			hargaMaster            sql.NullInt64
			hargaAgent             sql.NullInt64
			hargaUser              sql.NullInt64
			hargaGuest             sql.NullInt64
			hargaMasterWithPayment sql.NullInt64
			hargaAgentWithPayment  sql.NullInt64
			hargaUserWithPayment   sql.NullInt64
			hargaGuestWithPayment  sql.NullInt64
			dibuatPada             sql.NullTime
			diubahPada             sql.NullTime
		)
		if err := rows.Scan(
			&row.ID,
			&row.SKU,
			&row.Nama,
			&row.GroupName,
			&row.KategoriID,
			&row.KategoriNama,
			&row.BrandID,
			&row.BrandNama,
			&row.TipeHarga,
			&row.HargaDasarApp,
			&nominal,
			&maxNominal,
			&row.FeeMaster,
			&row.FeeAgent,
			&row.FeeUser,
			&row.FeeGuest,
			&hargaMaster,
			&hargaAgent,
			&hargaUser,
			&hargaGuest,
			&row.PaymentFeeMaster,
			&row.PaymentFeeAgent,
			&row.PaymentFeeUser,
			&row.PaymentFeeGuest,
			&hargaMasterWithPayment,
			&hargaAgentWithPayment,
			&hargaUserWithPayment,
			&hargaGuestWithPayment,
			&row.Aktif,
			&dibuatPada,
			&diubahPada,
		); err != nil {
			return nil, err
		}
		if nominal.Valid {
			v := nominal.Int64
			row.Nominal = &v
		}
		if maxNominal.Valid {
			v := maxNominal.Int64
			row.MaksimalNominal = &v
		}
		if hargaGuest.Valid {
			v := hargaGuest.Int64
			row.HargaGuestFinal = &v
		}
		if hargaMaster.Valid {
			v := hargaMaster.Int64
			row.HargaMasterFinal = &v
		}
		if hargaAgent.Valid {
			v := hargaAgent.Int64
			row.HargaAgentFinal = &v
		}
		if hargaUser.Valid {
			v := hargaUser.Int64
			row.HargaUserFinal = &v
		}
		if hargaMasterWithPayment.Valid {
			v := hargaMasterWithPayment.Int64
			row.HargaMasterWithPaymentFeeFinal = &v
		}
		if hargaAgentWithPayment.Valid {
			v := hargaAgentWithPayment.Int64
			row.HargaAgentWithPaymentFeeFinal = &v
		}
		if hargaUserWithPayment.Valid {
			v := hargaUserWithPayment.Int64
			row.HargaUserWithPaymentFeeFinal = &v
		}
		if hargaGuestWithPayment.Valid {
			v := hargaGuestWithPayment.Int64
			row.HargaGuestWithPaymentFeeFinal = &v
		}
		if dibuatPada.Valid {
			v := dibuatPada.Time
			row.DibuatPada = &v
		}
		if diubahPada.Valid {
			v := diubahPada.Time
			row.DiubahPada = &v
		}
		out = append(out, row)
	}
	return out, rows.Err()
}
