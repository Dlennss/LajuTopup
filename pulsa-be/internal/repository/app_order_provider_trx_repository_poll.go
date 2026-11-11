package repository

import "context"

type Pulsa24JamStatusCandidate struct {
	RefID       string
	RawRequest  string
	RawResponse string
}

// Claim a bounded batch so restarts or multiple workers cannot create a tight retry loop.
func (r *AppOrderProviderTrxRepository) ClaimPulsa24JamStatusChecks(ctx context.Context) ([]Pulsa24JamStatusCandidate, error) {
	rows, err := r.db.QueryContext(ctx, `
WITH candidates AS (
  SELECT p.id FROM app_order_provider_trx p
  JOIN app_order o ON o.id = p.app_order_id
  WHERE p.provider = 'pulsa24jam' AND p.status IN ('pending', 'success')
    AND o.status = 'processing_provider'
    AND p.diubah_pada < now() - interval '60 seconds'
  ORDER BY p.diubah_pada, p.id
  LIMIT 10 FOR UPDATE OF p SKIP LOCKED
)
UPDATE app_order_provider_trx p SET diubah_pada = now()
FROM candidates c WHERE p.id = c.id
RETURNING p.ref_id, COALESCE(p.raw_request::text, '{}'), COALESCE(p.raw_callback::text, '{}')`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []Pulsa24JamStatusCandidate
	for rows.Next() {
		var item Pulsa24JamStatusCandidate
		if err := rows.Scan(&item.RefID, &item.RawRequest, &item.RawResponse); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}
