import type { UserCategoryItem } from "@/components/user/types";

const LEGACY_NAMES: Record<string, string[]> = {
  "voucher-game": ["Game"], game: ["Game"], pulsa: ["Pulsa"],
  "paket-data": ["Paket Data"], ewallet: ["E-Wallet", "E-Money"],
  "transfer-bank": ["Bank Transfer", "Transfer Bank"],
  "hp-pascabayar": ["Pascabayar"], pdam: ["Tagihan Air"],
  "gas-pgn": ["Tagihan Gas"], pgn: ["Tagihan Gas"], bpjs: ["BPJS"],
  "tv-kabel": ["TV & Streaming"], tv: ["TV & Streaming"],
  "internet-wifi": ["Internet & Telco"], "internet-pascabayar": ["Internet & Telco"],
  listrik: ["PLN"], "paket-telepon": ["Telepon & SMS"],
};

export function matchingH2HRCategories(categories: UserCategoryItem[], key: string) {
  const names = LEGACY_NAMES[key] ?? [key];
  return categories.filter((category) => category.aktif && (
    String(category.id) === key || names.some((name) => name.toLowerCase() === category.nama.toLowerCase())
  ));
}

export function isH2HRBillingCategory(name: string) {
  return ["Asuransi", "BPJS", "Internet & Telco", "Multifinance", "Pajak Daerah",
    "Pascabayar", "Pembayaran", "Samsat", "Tagihan Air", "Tagihan Gas"]
    .some((category) => category.toLowerCase() === name.toLowerCase());
}
