package repository

import "testing"

func TestValidatePulsa24JamCatalog(t *testing.T) {
	valid := Pulsa24JamCatalogItem{SKU: "DB COMMONWEALTH", Name: "Bank", CategoryName: "Transfer Bank", BrandName: "Bank", PriceType: "OPEN_AMOUNT", Price: 1500}
	if err := validatePulsa24JamCatalog([]Pulsa24JamCatalogItem{valid}); err != nil {
		t.Fatal(err)
	}
	if got := normalizePulsa24JamCatalogItem(valid); got.GroupName != "" || got.SKU != valid.SKU {
		t.Fatalf("provider fields changed: %+v", got)
	}
	for _, mutate := range []func(*Pulsa24JamCatalogItem){
		func(p *Pulsa24JamCatalogItem) { p.SKU = "" }, func(p *Pulsa24JamCatalogItem) { p.BrandName = "" },
		func(p *Pulsa24JamCatalogItem) { p.CategoryName = "" }, func(p *Pulsa24JamCatalogItem) { p.Price = -1 },
		func(p *Pulsa24JamCatalogItem) { p.PriceType = "unknown" },
	} {
		p := valid
		mutate(&p)
		if validatePulsa24JamCatalog([]Pulsa24JamCatalogItem{p}) == nil {
			t.Fatalf("invalid item accepted: %+v", p)
		}
	}
	if validatePulsa24JamCatalog(nil) == nil || validatePulsa24JamCatalog([]Pulsa24JamCatalogItem{valid, valid}) == nil {
		t.Fatal("empty or duplicate catalog accepted")
	}
}
