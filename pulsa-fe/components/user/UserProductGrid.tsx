"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { UserProductItem } from "@/components/user/types";
import { UserCheckoutModal } from "@/components/user/UserCheckoutModal";
import { getDisplayedFixedPrice } from "@/components/guest/product-card-shared";
import { getRetailFeeForProduct } from "@/lib/retailRoles";
import { isH2HRBillingCategory } from "@/lib/h2hr-categories";

type Props = {
  items: UserProductItem[];
  isLoggedIn: boolean;
  authToken?: string;
  buyerRole?: string;
  initialDest?: string;
  canBuy?: boolean;
  buyBlockedLabel?: string;
  enableGuestHint?: boolean;
  buyLabel?: string;
  hidePrice?: boolean;
};

export function UserProductGrid({ items, isLoggedIn, authToken, buyerRole, initialDest = "", canBuy = true, buyBlockedLabel, buyLabel, hidePrice = false }: Props) {
  const [selected, setSelected] = useState<UserProductItem | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const filtered = useMemo(() => items.filter((item) => `${item.nama} ${item.sku}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const role = isLoggedIn ? buyerRole : "guest";
  const rupiah = (value: number) => `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
  return <div className="space-y-4 pb-24">
    <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <Search className="h-4 w-4 shrink-0 text-zinc-500" />
      <input aria-label="Cari nama atau SKU" placeholder="Cari nama atau SKU" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(40); }} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
    </label>
    <p className="text-xs text-zinc-500">{filtered.length} produk</p>
    <div className="grid grid-cols-2 gap-3">
      {filtered.slice(0, limit).map((item) => {
        const fixed = item.tipe_harga === "FIXED";
        const billing = isH2HRBillingCategory(item.kategori_nama || "") || /PASCABAYAR/i.test(item.nama);
        const price = fixed ? getDisplayedFixedPrice(item, role) : Number(item.harga_dasar_app || 0) + getRetailFeeForProduct(item, role);
        return <article key={item.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex-1 space-y-2">
            <p className="break-all text-[10px] font-medium text-zinc-500">{item.sku}</p>
            <h2 className="break-words text-sm font-semibold leading-5 text-zinc-900">{item.nama}</h2>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">{hidePrice ? "Tagihan" : fixed && !billing ? "Harga" : "Biaya layanan"}</p>
            <p className="mt-1 break-words text-sm font-bold text-zinc-900">{hidePrice ? "Cek tagihan dahulu" : price == null ? "Tidak tersedia" : `${fixed ? "" : "+ "}${rupiah(price)}`}</p>
          </div>
          <button type="button" disabled={!canBuy || price == null || billing} onClick={() => setSelected(item)} className="min-h-9 rounded-md bg-red-600 px-2 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">{billing ? "Cek tagihan diperlukan" : canBuy ? (buyLabel || "Pilih") : (buyBlockedLabel || "Lengkapi data")}</button>
        </article>;
      })}
    </div>
    {!filtered.length && <p className="py-6 text-center text-sm text-zinc-500">Produk tidak ditemukan.</p>}
    {filtered.length > limit && <button type="button" onClick={() => setLimit((value) => value + 40)} className="min-h-10 w-full rounded-md border border-zinc-300 bg-white text-sm font-semibold">Tampilkan lebih banyak</button>}
    <UserCheckoutModal open={Boolean(selected)} product={selected} authToken={authToken} buyerRole={buyerRole} initialDest={initialDest} onClose={() => setSelected(null)} />
  </div>;
}
