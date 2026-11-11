"use client";

import Image from "next/image";
import { Wallet } from "lucide-react";
import { UserProductGrid } from "@/components/user/UserProductGrid";
import type { UserProductItem } from "@/components/user/types";
import { getBrandLogo } from "@/lib/brand-logos";

type Props = { items: UserProductItem[]; isLoggedIn: boolean; authToken?: string; mode: "guest" | "user"; buyerRole?: string; initialDest?: string };

export function EMoneyBrandFlow(props: Props) {
  const name = props.items[0]?.brand_nama || "E-Wallet";
  const logo = getBrandLogo(name);
  return <div className="space-y-5 pt-4">
    <header className="flex items-center gap-4 border-b border-zinc-200 pb-4">
      <div className="flex h-16 w-20 shrink-0 items-center justify-center bg-white p-2">
        {logo ? <Image src={logo.src} alt={logo.alt} width={80} height={64} className="h-full w-full object-contain" /> : <Wallet className="h-8 w-8 text-zinc-500" />}
      </div>
      <h1 className="min-w-0 break-words text-xl font-bold text-zinc-900">{name}</h1>
    </header>
    <UserProductGrid {...props} buyLabel="Top Up" enableGuestHint={false} />
  </div>;
}
