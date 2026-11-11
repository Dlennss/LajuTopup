package router

import (
	"context"
	"database/sql"
	"log"
	"time"

	"pulsa2/internal/provider"
	"pulsa2/internal/repository"
	"pulsa2/internal/service"
)

func startPulsa24JamOrderStatusSync(db *sql.DB, client provider.Client, callbacks *service.ProviderCallbackService) {
	p24, ok := client.(*provider.Pulsa24JamAdapter)
	if db == nil || !ok || !p24.Configured() {
		return
	}
	svc := service.NewPulsa24JamOrderStatusService(repository.NewAppOrderProviderTrxRepository(db), p24, callbacks)
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
			err := svc.Sync(ctx)
			cancel()
			if err != nil {
				log.Printf("pulsa24jam order status sync: %v", err)
			}
		}
	}()
}
