package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"pulsa2/internal/provider"
	"pulsa2/internal/repository"
)

type pulsa24JamStatusStore interface {
	ClaimPulsa24JamStatusChecks(context.Context) ([]repository.Pulsa24JamStatusCandidate, error)
}

type Pulsa24JamOrderStatusService struct {
	store  pulsa24JamStatusStore
	client provider.Client
	apply  func(context.Context, string, url.Values, map[string]any) (int, map[string]any)
}

func NewPulsa24JamOrderStatusService(store pulsa24JamStatusStore, client provider.Client, callbacks *ProviderCallbackService) *Pulsa24JamOrderStatusService {
	return &Pulsa24JamOrderStatusService{store: store, client: client, apply: callbacks.ProcessPulsa24JamCallback}
}

func (s *Pulsa24JamOrderStatusService) Sync(ctx context.Context) error {
	items, err := s.store.ClaimPulsa24JamStatusChecks(ctx)
	if err != nil {
		return err
	}
	for _, item := range items {
		if err := ctx.Err(); err != nil {
			return err
		}
		req, ok := pulsa24JamExistingStatusRequest(item)
		if !ok {
			continue
		}
		callCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		response, callErr := s.client.Pay(callCtx, req)
		cancel()
		if callErr != nil || response == nil || response.HTTPStatus != 200 {
			continue
		}
		var payload map[string]any
		if json.Unmarshal([]byte(response.Body), &payload) != nil || payload["ok"] != true {
			continue
		}
		data := parsePulsa24JamCallback(response.Body, nil, payload)
		// Never treat transport errors, unknown references or ambiguous replies as final.
		if data.refid != item.RefID || !pulsa24JamExplicitFinalStatus(data.status) {
			continue
		}
		status, result := s.apply(ctx, response.Body, nil, payload)
		if status != 200 || result["ok"] != true {
			return fmt.Errorf("pulsa24jam status settlement failed refid=%s", item.RefID)
		}
	}
	return nil
}

func pulsa24JamExplicitFinalStatus(status string) bool {
	switch status {
	case "2", "success", "sukses", "3", "failed", "gagal":
		return true
	default:
		return false
	}
}

func pulsa24JamExistingStatusRequest(item repository.Pulsa24JamStatusCandidate) (provider.PayRequest, bool) {
	var stored struct {
		Product  string `json:"product"`
		Dest     string `json:"dest"`
		Qty      int64  `json:"qty"`
		RefID    string `json:"refid"`
		Provider string `json:"provider"`
	}
	if json.Unmarshal([]byte(item.RawRequest), &stored) != nil || item.RefID == "" ||
		stored.RefID != item.RefID || stored.Provider != "pulsa24jam" ||
		stored.Product == "" || stored.Dest == "" || stored.Qty <= 0 {
		return provider.PayRequest{}, false
	}
	var envelope struct {
		Body string `json:"body"`
	}
	if json.Unmarshal([]byte(item.RawResponse), &envelope) != nil {
		return provider.PayRequest{}, false
	}
	raw := item.RawResponse
	if envelope.Body != "" {
		raw = envelope.Body
	}
	var accepted struct {
		OK          bool            `json:"ok"`
		RefID       string          `json:"refid"`
		Status      json.RawMessage `json:"status"`
		Transaction struct {
			ID    int64  `json:"id"`
			RefID string `json:"ref_id"`
		} `json:"transaksi_member"`
	}
	if json.Unmarshal([]byte(raw), &accepted) != nil || !accepted.OK {
		return provider.PayRequest{}, false
	}
	// STATUS-PAY can create a missing transaction upstream. Only poll a reference
	// whose original response proves P24 already accepted this exact transaction.
	confirmed := accepted.Transaction.ID > 0 && accepted.Transaction.RefID == item.RefID
	if accepted.RefID == item.RefID && len(accepted.Status) > 0 {
		var payload map[string]any
		if json.Unmarshal([]byte(raw), &payload) == nil {
			status := parsePulsa24JamCallback(raw, nil, payload).status
			confirmed = status == "1" || status == "2" || status == "pending" || status == "success"
		}
	}
	if !confirmed {
		return provider.PayRequest{}, false
	}
	return provider.PayRequest{Command: "STATUS-PAY", Product: stored.Product,
		Dest: stored.Dest, Qty: stored.Qty, RefID: stored.RefID}, true
}
