import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Clock3,
  Droplets,
  Gamepad2,
  Grid2X2,
  Headphones,
  Lightbulb,
  MessageCircle,
  Plus,
  ReceiptText,
  Send,
  Smartphone,
  Tv,
  WalletCards,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserProfile, UserSession } from "@/components/user/types";

type LajuTopupHomeScreenProps = {
  user?: UserSession | null;
  profile?: UserProfile | null;
  variant?: "user" | "guest";
};

const assetBase = "/lajutopup-assets/LajuTopup_Assets_Pecah";

const services: Array<{
  key: string;
  label: string;
  Icon: LucideIcon;
  bg: string;
  color: string;
}> = [
  { key: "pulsa", label: "Pulsa", Icon: Smartphone, bg: "bg-[#ffe2e8]", color: "text-[#e81f4f]" },
  { key: "paket-data", label: "Paket Data", Icon: BarChart3, bg: "bg-[#e3f3ff]", color: "text-[#2f7be8]" },
  { key: "pln", label: "PLN", Icon: Lightbulb, bg: "bg-[#fff2c8]", color: "text-[#f59e0b]" },
  { key: "game", label: "Game", Icon: Gamepad2, bg: "bg-[#dff0ff]", color: "text-[#2377e6]" },
  { key: "ewallet", label: "E-Wallet", Icon: WalletCards, bg: "bg-[#dff8e9]", color: "text-[#16a463]" },
  { key: "tagihan", label: "Tagihan", Icon: ReceiptText, bg: "bg-[#ffe7d2]", color: "text-[#e35a22]" },
  { key: "tv", label: "TV Digital", Icon: Tv, bg: "bg-[#eee4ff]", color: "text-[#6d3fc4]" },
  { key: "telkom", label: "Telkom", Icon: Headphones, bg: "bg-[#ffe1eb]", color: "text-[#e52f63]" },
  { key: "pdam", label: "PDAM", Icon: Droplets, bg: "bg-[#e3f3ff]", color: "text-[#2f7be8]" },
  { key: "internet", label: "Internet", Icon: Wifi, bg: "bg-[#ffe5e6]", color: "text-[#db2834]" },
  { key: "lainnya", label: "Lainnya", Icon: MessageCircle, bg: "bg-[#def8e8]", color: "text-[#16a463]" },
  { key: "semua", label: "Semua", Icon: Grid2X2, bg: "bg-[#f1f2f5]", color: "text-[#777f8d]" },
];

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;
}

function pathFor(key: string, variant: "user" | "guest") {
  const isUser = variant === "user";

  switch (key) {
    case "pulsa":
      return isUser ? "/user/pulsa" : "/pulsa";
    case "paket-data":
      return isUser ? "/user/paket-data" : "/paket-data";
    case "pln":
      return isUser ? "/user/listrik" : "/listrik";
    case "ewallet":
      return isUser ? "/user/ewallet" : "/ewallet";
    case "tagihan":
      return isUser ? "/user/listrik/tagihan" : "/listrik/tagihan";
    default:
      return isUser ? "/user/kategori" : "/kategori";
  }
}

export function LajuTopupHomeScreen({ user, profile, variant = "user" }: LajuTopupHomeScreenProps) {
  const displayName = profile?.nama || user?.name || "User";
  const saldo = variant === "guest" ? 250000 : Number(profile?.saldo || 0);
  const saldoHref = variant === "user" ? "/user/saldo" : "/login";
  const topupHref = variant === "user" ? "/user/account/topup" : "/login";
  const sendHref = variant === "user" ? "/user/saldo/kirim" : "/login";
  const catalogHref = variant === "user" ? "/user/kategori" : "/kategori";
  const transaksiHref = variant === "user" ? "/user/transaksi" : "/transaksi";
  void displayName;

  return (
    <main className="min-h-svh bg-[#f6f4f3] pb-28 text-slate-950">
      <section className="mt-5 px-4">
        <div className="relative rounded-[22px] bg-white p-3.5 shadow-[0_18px_38px_rgba(80,39,35,0.13)] ring-1 ring-slate-950/[0.04]">
          <div className="grid min-h-[104px] grid-cols-[minmax(0,1fr)_88px] items-center gap-2.5 min-[360px]:grid-cols-[minmax(0,1fr)_106px] min-[390px]:gap-3">
            <Link href={saldoHref} prefetch={false} className="flex min-w-0 items-center gap-2.5 min-[390px]:gap-3">
              <div className="relative grid h-[54px] w-[54px] shrink-0 place-items-center overflow-hidden rounded-[17px] bg-[#fff1ed] min-[390px]:h-[64px] min-[390px]:w-[64px] min-[390px]:rounded-[18px]">
                <Image
                  src={`${assetBase}/02_balance_card/saldo_icon.png`}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-500 min-[390px]:text-[13px]">Saldo Utama</p>
                <p className="mt-1 truncate text-[20px] font-black leading-none tracking-tight text-slate-950 min-[390px]:text-[24px] min-[430px]:text-[26px]">
                  {formatRupiah(saldo)}
                </p>
                <p className="mt-1.5 truncate text-[11px] font-medium text-slate-500 min-[390px]:text-[12px]">
                  Isi saldo untuk transaksi lebih mudah
                </p>
              </div>
              <ChevronRight className="ml-auto hidden h-5 w-5 shrink-0 text-slate-900 min-[430px]:block" strokeWidth={2.7} />
            </Link>

            <div className="flex flex-col gap-2.5 border-l border-slate-200 pl-2.5 min-[390px]:pl-3">
              <Link
                href={topupHref}
                prefetch={false}
                className="inline-flex h-[46px] min-w-0 items-center justify-center gap-1 rounded-[14px] bg-linear-to-br from-[#ff512b] to-[#c91821] text-[12px] font-black text-white shadow-[0_12px_22px_rgba(216,42,28,0.24)] min-[390px]:h-[52px] min-[390px]:gap-1.5 min-[390px]:text-[14px]"
              >
                <Plus className="h-4.5 w-4.5 shrink-0 min-[390px]:h-5 min-[390px]:w-5" strokeWidth={2.3} />
                <span className="truncate">Isi Saldo</span>
              </Link>
              <Link
                href={sendHref}
                prefetch={false}
                className="inline-flex h-[40px] min-w-0 items-center justify-center gap-1 rounded-[14px] border border-[#efb5af] bg-[#fff5f3] text-[12px] font-black text-[#bd1e24] min-[390px]:h-[46px] min-[390px]:gap-1.5 min-[390px]:text-[14px]"
              >
                <Send className="h-4 w-4 shrink-0 fill-[#bd1e24]/10 min-[390px]:h-4.5 min-[390px]:w-4.5" strokeWidth={2.4} />
                <span className="truncate">Kirim</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <Link
          href={catalogHref}
          prefetch={false}
          className="relative block aspect-[953/292] overflow-hidden rounded-[18px] bg-[#bd1722] shadow-[0_18px_34px_rgba(147,36,24,0.18)] ring-1 ring-white/50"
        >
          <Image
            src={`${assetBase}/03_banner/hero_banner_full.png`}
            alt="Semua kebutuhan dalam satu aplikasi LajuTopup"
            fill
            sizes="(max-width: 768px) 100vw, 390px"
            className="object-fill"
            priority
          />
        </Link>
      </section>

      <section className="mt-4 px-4">
        <div className="rounded-[22px] bg-white px-3 py-4 shadow-[0_14px_30px_rgba(42,26,23,0.08)] ring-1 ring-slate-950/[0.04]">
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 min-[360px]:grid-cols-6 min-[390px]:gap-x-2.5 min-[390px]:gap-y-4">
            {services.map((service) => (
              <Link
                key={service.label}
                href={pathFor(service.key, variant)}
                prefetch={false}
                className="group flex min-w-0 flex-col items-center gap-2 text-center"
              >
                <span className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[16px] border border-slate-200/70 shadow-[0_8px_18px_rgba(35,25,22,0.06)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_24px_rgba(216,42,28,0.12)] ${service.bg}`}>
                  <service.Icon className={`h-6 w-6 ${service.color}`} strokeWidth={2.3} />
                </span>
                <span className="max-w-[54px] text-[11px] font-bold leading-tight text-slate-950 min-[390px]:text-[11.5px]">
                  {service.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-[18px] font-black tracking-tight text-slate-950">
            <Clock3 className="h-6 w-6 text-slate-950" strokeWidth={2.4} />
            Aktivitas Terakhir
          </h2>
          <Link href={transaksiHref} prefetch={false} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500">
            Lihat Semua
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>

        <Link
          href={transaksiHref}
          prefetch={false}
          className="flex items-center gap-3 rounded-[20px] bg-white p-4 shadow-[0_14px_28px_rgba(37,25,22,0.07)] ring-1 ring-slate-950/[0.04]"
        >
          <span className="relative grid h-[54px] w-[54px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-[#e9fff3]">
            <Image
              src={`${assetBase}/07_activity/activity_icon.png`}
              alt=""
              fill
              sizes="54px"
              className="object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-black text-slate-950">Pulsa Telkomsel 50.000</span>
            <span className="mt-1 block text-[12px] font-medium text-slate-500">12 Sep 2025, 14:32</span>
          </span>
          <span className="text-right">
            <span className="block text-[15px] font-black text-slate-950">- Rp 50.000</span>
            <span className="mt-2 inline-flex rounded-full bg-[#dcfff0] px-4 py-1.5 text-[12px] font-black text-[#10a85d]">
              Berhasil
            </span>
          </span>
        </Link>
      </section>

      <div className="h-6" />
    </main>
  );
}
