"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, UserRound, WalletCards } from "lucide-react";

function navClass(active: boolean) {
  return active
    ? "flex min-w-0 flex-col items-center gap-1.5 py-1 text-[#ef1d2b]! visited:text-[#ef1d2b]!"
    : "flex min-w-0 flex-col items-center gap-1.5 py-1 text-slate-500! transition visited:text-slate-500! hover:text-[#ef1d2b]!";
}

function isActivePath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

const iconClass = "h-5 w-5";
const textClass = "text-[11px] font-bold leading-none";

export function UserBottomNav() {
  const pathname = usePathname() || "";
  const trxActive = isActivePath(pathname, "/user/transaksi");
  const saldoActive = isActivePath(pathname, "/user/saldo") || isActivePath(pathname, "/user/account/topup") || isActivePath(pathname, "/user/account/mutasi");
  const accountActive = isActivePath(pathname, "/user/account") && !saldoActive;
  const homeActive = isActivePath(pathname, "/user") && !trxActive && !accountActive && !saldoActive;

  return (
    <section className="brand-bottom-nav fixed bottom-0 left-1/2 z-[90] w-full max-w-md -translate-x-1/2 rounded-t-[28px] bg-white/98 shadow-[0_-14px_34px_rgba(42,26,23,0.12)] ring-1 ring-slate-950/[0.04] backdrop-blur-xl md:bottom-4 md:w-97.5 md:max-w-none md:rounded-[28px]">
      <div className="grid grid-cols-4 items-end px-5 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-3">
        <Link href="/user" className={navClass(homeActive)}>
          <House className={iconClass} strokeWidth={1.65} />
          <span className={textClass}>Beranda</span>
        </Link>

        <Link href="/user/transaksi" className={navClass(trxActive)}>
          <History className={iconClass} strokeWidth={1.65} />
          <span className={textClass}>Riwayat</span>
        </Link>

        <Link href="/user/saldo" className={navClass(saldoActive)}>
          <WalletCards className={iconClass} strokeWidth={1.65} />
          <span className={textClass}>Saldo</span>
        </Link>

        <Link href="/user/account" className={navClass(accountActive)}>
          <UserRound className={iconClass} strokeWidth={1.65} />
          <span className={textClass}>Akun</span>
        </Link>
      </div>
    </section>
  );
}
