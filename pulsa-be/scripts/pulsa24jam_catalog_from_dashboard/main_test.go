package main

import "testing"

func TestDashboardPreservesProviderFields(t *testing.T) {
	lines := []string{"Total Produk Aktif", "2", "Produk Dengan Harga Tetap", "1", "Bank Transfer", "Bank", "SKU", "Keterangan", "Harga", "DB COMMONWEALTH", "BANK COMMONWEALTH", "PULSA", "OPEN_AMOUNT", "+ Rp 1.500", "TEST", "Fixed product", "-", "FIXED", "Rp 0"}
	items := parseDashboardProducts(lines)
	if err := validateProducts(lines, items); err != nil {
		t.Fatal(err)
	}
	if len(items) != 2 || items[0].SKU != "DB COMMONWEALTH" || items[0].GroupName != "PULSA" || items[0].Price != 1500 || items[1].GroupName != "" {
		t.Fatalf("unexpected products: %+v", items)
	}
}

func TestDashboardRejectsIncompleteOrDuplicateExport(t *testing.T) {
	item := productRow{SKU: "A", PriceType: "FIXED", Price: 1000}
	for _, tc := range []struct {
		lines []string
		rows  []productRow
	}{
		{[]string{"Total Produk Aktif", "2", "Rp 1.000"}, []productRow{item}},
		{[]string{"Rp 1.000", "Rp 1.000"}, []productRow{item, item}},
		{[]string{"Rp 1.000", "Rp 1.000"}, []productRow{item}},
	} {
		if validateProducts(tc.lines, tc.rows) == nil {
			t.Fatal("invalid export accepted")
		}
	}
}
