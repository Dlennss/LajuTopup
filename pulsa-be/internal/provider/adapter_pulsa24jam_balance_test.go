package provider

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPulsa24JamBalance(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/v1/trx" {
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("X-Api-Key"); got != "api-key" {
			t.Fatalf("unexpected API key %q", got)
		}
		var payload pulsa24JamPayRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Fatal(err)
		}
		if payload.Commands != "SALDO" || payload.PIN != "1234" {
			t.Fatalf("unexpected payload %#v", payload)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true,"command":"SALDO","balance":300000}`))
	}))
	defer server.Close()

	adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{
		BaseURL: server.URL,
		APIKey:  "api-key",
		PIN:     "1234",
	})
	got, err := adapter.Balance(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if got.Balance != 300000 || got.Command != "SALDO" || got.HTTPStatus != http.StatusOK {
		t.Fatalf("unexpected balance response %#v", got)
	}
}

func TestPulsa24JamBalanceRejectsFailedResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"ok":false,"error":"commands tidak didukung"}`))
	}))
	defer server.Close()

	adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{
		BaseURL: server.URL,
		APIKey:  "api-key",
		PIN:     "1234",
	})
	if _, err := adapter.Balance(context.Background()); err == nil {
		t.Fatal("expected balance request error")
	}
}
