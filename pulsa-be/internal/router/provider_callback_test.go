package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestPulsa24JamCallbackAliasesRequireToken(t *testing.T) {
	t.Setenv("PULSA24JAM_CALLBACK_TOKEN", "test-token-only")
	mux := http.NewServeMux()
	ProviderCallbackRouter(mux, ProviderCallbackDeps{})
	for _, path := range []string{"/v1/webhook/pulsa24jam", "/v1/webhooks/pulsa24jam", "/webhook/pulsa24jam", "/webhooks/pulsa24jam", "/api/v1/webhook/pulsa24jam", "/api/v1/webhooks/pulsa24jam"} {
		for _, method := range []string{http.MethodGet, http.MethodPost} {
			rr := httptest.NewRecorder()
			req := httptest.NewRequest(method, path, strings.NewReader(`{}`))
			mux.ServeHTTP(rr, req)
			if rr.Code != http.StatusUnauthorized {
				t.Fatalf("%s %s: want 401, got %d", method, path, rr.Code)
			}
		}
	}
}
