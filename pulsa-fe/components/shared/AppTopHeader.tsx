import Image from "next/image";
import Link from "next/link";
import { Bell, Headphones } from "lucide-react";

type AppTopHeaderProps = {
  isLoggedIn?: boolean;
  userName?: string | null;
  saldo?: number | null;
  role?: string | null;
};

export function AppTopHeader({ isLoggedIn = false, userName, saldo, role }: AppTopHeaderProps) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const isRetailLoggedIn = isLoggedIn && (normalizedRole === "user" || normalizedRole === "agent" || normalizedRole === "master");
  const homeHref = isRetailLoggedIn ? "/user" : "/";
  void userName;
  void saldo;

  return (
    <header className="brand-app-header sticky top-0 z-30 overflow-hidden bg-[#c91d23] px-5 pb-14 pt-6 text-white shadow-[0_18px_40px_rgba(166,29,24,0.24)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,178,36,0.72),transparent_34%),linear-gradient(135deg,#c91520_0%,#d92f18_44%,#ff7b00_100%)]" />
      <div className="pointer-events-none absolute -left-16 bottom-[-56px] h-36 w-72 rounded-[50%] bg-white/95" />
      <div className="pointer-events-none absolute left-[36%] top-7 h-28 w-80 -rotate-12 rounded-[50%] bg-[#90151d]/18" />
      <div className="pointer-events-none absolute right-[-24%] top-7 h-36 w-96 -rotate-12 rounded-[50%] bg-[#ff9c12]/22" />

      <div className="relative flex h-20 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center pt-1">
          <Link
            href={homeHref}
            prefetch={false}
            className="flex min-w-0 items-center gap-3"
            aria-label="LajuTopup"
          >
            <span className="relative grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[17px] bg-white shadow-[0_10px_20px_rgba(255,210,67,0.35)] ring-2 ring-yellow-300/80 min-[380px]:h-[58px] min-[380px]:w-[58px] min-[380px]:rounded-[18px]">
              <Image
                src="/lajutopup-assets/LajuTopup_Assets_Pecah/01_header/logo_symbol.png"
                alt=""
                fill
                sizes="58px"
                className="object-cover"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="block text-[24px] font-black italic leading-6 tracking-tight drop-shadow-sm min-[380px]:text-[28px] min-[380px]:leading-7">
                <span className="brand-wordmark">LajuTopup</span>
              </span>
              <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-white/95 min-[380px]:text-[12px] min-[380px]:tracking-[0.11em]">
                Isi ulang, terus melaju
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={isRetailLoggedIn ? "/user/transaksi" : "/login"}
            prefetch={false}
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-slate-950 shadow-[0_12px_26px_rgba(105,23,16,0.22)] transition hover:-translate-y-0.5 min-[380px]:h-[54px] min-[380px]:w-[54px]"
            aria-label="Notifikasi transaksi"
          >
            <Bell className="h-6 w-6" strokeWidth={2.2} />
            {isRetailLoggedIn ? (
              <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#ef1d2b] text-[12px] font-black text-white ring-2 ring-white">
                3
              </span>
            ) : null}
          </Link>
          <a
            href="https://wa.me/6282219107558"
            target="_blank"
            rel="noreferrer"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-slate-950 shadow-[0_12px_26px_rgba(105,23,16,0.22)] transition hover:-translate-y-0.5 min-[380px]:h-[54px] min-[380px]:w-[54px]"
            aria-label="Hubungi bantuan via WhatsApp"
          >
            <Headphones className="h-6 w-6" strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </header>
  );
}
