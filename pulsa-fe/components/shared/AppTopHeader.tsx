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
    <header className="brand-app-header sticky top-0 z-10 overflow-hidden bg-[#c91d23] px-4 py-4 text-white shadow-[0_12px_26px_rgba(166,29,24,0.2)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,178,36,0.72),transparent_34%),linear-gradient(135deg,#c91520_0%,#d92f18_44%,#ff7b00_100%)]" />
      <div className="pointer-events-none absolute left-[36%] top-4 h-20 w-80 -rotate-12 rounded-[50%] bg-[#90151d]/18" />
      <div className="pointer-events-none absolute right-[-24%] top-3 h-24 w-96 -rotate-12 rounded-[50%] bg-[#ff9c12]/22" />

      <div className="relative flex h-[58px] items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            href={homeHref}
            prefetch={false}
            className="flex min-w-0 items-center gap-2.5"
            aria-label="LajuTopup"
          >
            <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-white shadow-[0_10px_20px_rgba(255,210,67,0.35)] ring-2 ring-yellow-300/80 min-[390px]:h-[54px] min-[390px]:w-[54px] min-[390px]:rounded-[18px]">
              <Image
                src="/lajutopup-assets/LajuTopup_Assets_Pecah/01_header/logo_symbol.png"
                alt=""
                fill
                sizes="54px"
                className="object-cover"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="block text-[23px] font-black italic leading-6 tracking-tight drop-shadow-sm min-[390px]:text-[26px]">
                <span className="brand-wordmark">LajuTopup</span>
              </span>
              <span className="mt-1 block max-w-[158px] text-[10px] font-extrabold uppercase leading-3 tracking-[0.06em] text-white/95 min-[390px]:max-w-none min-[390px]:text-[11px] min-[390px]:tracking-[0.08em]">
                Isi ulang, terus melaju
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={isRetailLoggedIn ? "/user/transaksi" : "/login"}
            prefetch={false}
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-slate-950 shadow-[0_12px_26px_rgba(105,23,16,0.22)] transition hover:-translate-y-0.5 min-[390px]:h-12 min-[390px]:w-12"
            aria-label="Notifikasi transaksi"
          >
            <Bell className="h-5 w-5 min-[390px]:h-6 min-[390px]:w-6" strokeWidth={2.2} />
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-slate-950 shadow-[0_12px_26px_rgba(105,23,16,0.22)] transition hover:-translate-y-0.5 min-[390px]:h-12 min-[390px]:w-12"
            aria-label="Hubungi bantuan via WhatsApp"
          >
            <Headphones className="h-5 w-5 min-[390px]:h-6 min-[390px]:w-6" strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </header>
  );
}
