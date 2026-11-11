package service

import (
	"context"
	"errors"
	"net/url"
	"testing"

	"pulsa2/internal/provider"
	"pulsa2/internal/repository"
)

func p24StatusCandidate() repository.Pulsa24JamStatusCandidate {
	return repository.Pulsa24JamStatusCandidate{
		RefID:       "TEST-REF",
		RawRequest:  `{"provider":"pulsa24jam","product":"DANA","dest":"080000000000","qty":20000,"refid":"TEST-REF"}`,
		RawResponse: `{"body":"{\"ok\":true,\"transaksi_member\":{\"id\":123,\"ref_id\":\"TEST-REF\",\"status\":1}}"}`,
	}
}

func TestPulsa24JamExistingStatusRequest(t *testing.T) {
	for _, tc := range []struct {
		name, request, response string
		want                    bool
	}{
		{name: "accepted nested transaction", want: true},
		{name: "accepted flat transaction", response: `{"ok":true,"refid":"TEST-REF","status":1}`, want: true},
		{name: "retry final settlement", response: `{"ok":true,"refid":"TEST-REF","status":2}`, want: true},
		{name: "timeout without acceptance", response: `{"error":"timeout"}`},
		{name: "ok alone is not acceptance", response: `{"ok":true}`},
		{name: "mismatched accepted ref", response: `{"ok":true,"transaksi_member":{"id":123,"ref_id":"OTHER"}}`},
		{name: "rejected transaction", response: `{"ok":true,"refid":"TEST-REF","status":3}`},
		{name: "malformed response", response: `{`},
		{name: "missing saved request", request: `{}`},
		{name: "mismatched request", request: `{"provider":"pulsa24jam","product":"DANA","dest":"080000000000","qty":20000,"refid":"OTHER"}`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			item := p24StatusCandidate()
			if tc.request != "" {
				item.RawRequest = tc.request
			}
			if tc.response != "" {
				item.RawResponse = tc.response
			}
			req, ok := pulsa24JamExistingStatusRequest(item)
			if ok != tc.want {
				t.Fatalf("accepted=%v, want %v", ok, tc.want)
			}
			if ok && (req.Command != "STATUS-PAY" || req.RefID != item.RefID || req.Qty != 20000 || req.Product != "DANA" || req.Dest != "080000000000") {
				t.Fatalf("status request changed original purchase: %+v", req)
			}
		})
	}
}

type p24StatusStoreStub struct {
	items []repository.Pulsa24JamStatusCandidate
}

func (s p24StatusStoreStub) ClaimPulsa24JamStatusChecks(context.Context) ([]repository.Pulsa24JamStatusCandidate, error) {
	return s.items, nil
}

type p24StatusClientStub struct {
	response *provider.PayResponse
	err      error
	calls    int
}

func (s *p24StatusClientStub) Name() string { return "pulsa24jam" }
func (s *p24StatusClientStub) Pay(_ context.Context, req provider.PayRequest) (*provider.PayResponse, error) {
	if req.Command != "STATUS-PAY" {
		panic("must never send PAY")
	}
	s.calls++
	return s.response, s.err
}

func TestPulsa24JamStatusSync(t *testing.T) {
	for _, tc := range []struct {
		name, body string
		httpStatus int
		err        error
		settle     bool
	}{
		{name: "success despite missing callback", body: `{"ok":true,"refid":"TEST-REF","status":2,"callback":{"delivered":false,"http_status":404}}`, httpStatus: 200, settle: true},
		{name: "confirmed failure", body: `{"ok":true,"refid":"TEST-REF","status":3}`, httpStatus: 200, settle: true},
		{name: "pending", body: `{"ok":true,"refid":"TEST-REF","status":1}`, httpStatus: 200},
		{name: "wrong ref", body: `{"ok":true,"refid":"OTHER","status":2}`, httpStatus: 200},
		{name: "not found", body: `{"ok":true,"refid":"TEST-REF","message":"Transaksi tidak ditemukan"}`, httpStatus: 200},
		{name: "auth error", body: `{"ok":false,"refid":"TEST-REF","status":3}`, httpStatus: 200},
		{name: "http error", body: `{"ok":true,"refid":"TEST-REF","status":3}`, httpStatus: 502},
		{name: "invalid json", body: `{`, httpStatus: 200},
		{name: "timeout", err: errors.New("timeout")},
	} {
		t.Run(tc.name, func(t *testing.T) {
			client := &p24StatusClientStub{response: &provider.PayResponse{HTTPStatus: tc.httpStatus, Body: tc.body}, err: tc.err}
			calls := 0
			svc := &Pulsa24JamOrderStatusService{store: p24StatusStoreStub{[]repository.Pulsa24JamStatusCandidate{p24StatusCandidate()}}, client: client,
				apply: func(_ context.Context, raw string, _ url.Values, payload map[string]any) (int, map[string]any) {
					calls++
					if raw != tc.body || payload["refid"] != "TEST-REF" {
						t.Fatal("lost upstream evidence")
					}
					return 200, map[string]any{"ok": true}
				}}
			if err := svc.Sync(context.Background()); err != nil {
				t.Fatal(err)
			}
			if (calls == 1) != tc.settle || client.calls != 1 {
				t.Fatalf("settlements=%d provider calls=%d", calls, client.calls)
			}
		})
	}
}

func TestPulsa24JamStatusSyncSkipsUnacceptedTransaction(t *testing.T) {
	item := p24StatusCandidate()
	item.RawResponse = `{"error":"timeout"}`
	client := &p24StatusClientStub{}
	svc := &Pulsa24JamOrderStatusService{store: p24StatusStoreStub{[]repository.Pulsa24JamStatusCandidate{item}}, client: client}
	if err := svc.Sync(context.Background()); err != nil {
		t.Fatal(err)
	}
	if client.calls != 0 {
		t.Fatal("unaccepted transaction must not be submitted to STATUS-PAY")
	}
}
