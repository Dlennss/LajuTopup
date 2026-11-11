"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ChevronRight, Smartphone, Wallet, Gamepad2, Zap, Tv, Droplets, Landmark, ReceiptText } from "lucide-react";
import type { UserCategoryItem } from "@/components/user/types";

function categoryIcon(name: string) {
  if (/pulsa|data|telepon/i.test(name)) return Smartphone;
  if (/wallet|money/i.test(name)) return Wallet;
  if (/game/i.test(name)) return Gamepad2;
  if (/pln/i.test(name)) return Zap;
  if (/tv|streaming/i.test(name)) return Tv;
  if (/air/i.test(name)) return Droplets;
  if (/bank/i.test(name)) return Landmark;
  return ReceiptText;
}

export function ServiceDirectory({ mode = "guest", categories }: { mode?: "guest" | "user"; categories: UserCategoryItem[] }) {
  const [query, setQuery] = useState("");
  const visible = categories.filter((item) => item.aktif && item.nama.toLowerCase().includes(query.toLowerCase()));
  const prefix = mode === "user" ? "/user" : "";
  return <section className="space-y-4 pb-24">
    <h1 className="text-xl font-bold text-zinc-900">Semua Layanan</h1>
    <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <Search className="h-4 w-4 shrink-0 text-zinc-500" />
      <input aria-label="Cari layanan" placeholder="Cari layanan" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
    </label>
    <div className="grid grid-cols-2 gap-3">
      {visible.map((item, index) => {
        const Icon = categoryIcon(item.nama);
        const colors = ["bg-red-50 text-red-600", "bg-sky-50 text-sky-600", "bg-emerald-50 text-emerald-600", "bg-amber-50 text-amber-600"];
        return <Link key={item.id} href={`${prefix}/kategori/${item.id}`} className="flex min-h-24 items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 hover:border-red-300">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${colors[index % colors.length]}`}><Icon className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1 break-words text-xs font-semibold text-zinc-800">{item.nama}</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
        </Link>;
      })}
    </div>
    {!visible.length && <p className="py-8 text-center text-sm text-zinc-500">Layanan tidak ditemukan.</p>}
  </section>;
}
