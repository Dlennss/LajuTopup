import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Clock3,
  Flame,
  Plus,
  Send,
} from "lucide-react";
import type { UserProfile, UserSession } from "@/components/user/types";

type LajuTopupHomeScreenProps = {
  user?: UserSession | null;
  profile?: UserProfile | null;
  variant?: "user" | "guest";
};

const assetBase = "/lajutopup-assets/LajuTopup_Assets_Pecah";

const services = [
  { key: "pulsa", label: "Pulsa", icon: `${assetBase}/05_service_icons/icon_pulsa.png` },
  { key: "paket-data", label: "Paket Data", icon: `${assetBase}/05_service_icons/icon_paket_data.png` },
  { key: "pln", label: "PLN", icon: `${assetBase}/05_service_icons/icon_pln.png` },
  { key: "game", label: "Game", icon: `${assetBase}/05_service_icons/icon_game.png` },
  { key: "ewallet", label: "E-Wallet", icon: `${assetBase}/05_service_icons/icon_ewallet.png` },
  { key: "tagihan", label: "Tagihan", icon: `${assetBase}/05_service_icons/icon_tagihan.png` },
  { key: "tv", label: "TV Digital", icon: `${assetBase}/05_service_icons/icon_tv.png` },
  { key: "telkom", label: "Telkom", icon: `${assetBase}/05_service_icons/icon_telkom.png` },
  { key: "pdam", label: "PDAM", icon: `${assetBase}/05_service_icons/icon_pdam.png` },
  { key: "internet", label: "Internet", icon: `${assetBase}/05_service_icons/icon_internet.png` },
  { key: "lainnya", label: "Lainnya", icon: `${assetBase}/05_service_icons/icon_lainnya.png` },
  { key: "semua", label: "Semua", icon: `${assetBase}/05_service_icons/icon_semua.png` },
];

const promos = [
  {
    label: "Cashback setiap transaksi",
    href: "/user/kategori",
    image: `${assetBase}/06_promo/promo_cashback_card.png`,
  },
  {
    label: "Harga lebih murah",
    href: "/user/pulsa-data",
    image: `${assetBase}/06_promo/promo_harga_murah_card.png`,
  },
  {
    label: "Transaksi lebih cepat",
    href: "/user/kategori",
    image: `${assetBase}/06_promo/promo_transaksi_cepat_card.png`,
  },
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
  const pulsaDataHref = variant === "user" ? "/user/pulsa-data" : "/pulsa-data";
  const transaksiHref = variant === "user" ? "/user/transaksi" : "/transaksi";
  void displayName;

  return (
    <main className="min-h-svh bg-[#f6f4f3] pb-28 text-slate-950">
      <section className="-mt-10 px-4">
        <div className="relative z-10 overflow-hidden rounded-[24px] bg-white p-4 shadow-[0_18px_38px_rgba(80,39,35,0.13)] ring-1 ring-slate-950/[0.04]">
          <div className="grid grid-cols-[1fr_112px] gap-3">
            <Link href={saldoHref} prefetch={false} className="flex min-w-0 items-center gap-4">
              <div className="relative grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-[22px] bg-[#fff1ed]">
                <Image
                  src={`${assetBase}/02_balance_card/saldo_icon.png`}
                  alt=""
                  fill
                  sizes="76px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-500">Saldo Utama</p>
                <p className="mt-1 truncate text-[31px] font-black leading-none tracking-tight text-slate-950">
                  {formatRupiah(saldo)}
                </p>
                <p className="mt-2 truncate text-[13px] font-medium text-slate-500">
                  Isi saldo untuk transaksi lebih mudah
                </p>
              </div>
              <ChevronRight className="ml-auto hidden h-6 w-6 shrink-0 text-slate-900 min-[390px]:block" strokeWidth={2.7} />
            </Link>

            <div className="flex flex-col gap-3 border-l border-slate-200 pl-3">
              <Link
                href={topupHref}
                prefetch={false}
                className="inline-flex h-[56px] items-center justify-center gap-1.5 rounded-[15px] bg-linear-to-br from-[#ff512b] to-[#c91821] text-[14px] font-black text-white shadow-[0_12px_22px_rgba(216,42,28,0.24)] min-[380px]:gap-2 min-[380px]:text-[16px]"
              >
                <Plus className="h-6 w-6" strokeWidth={2.3} />
                Isi Saldo
              </Link>
              <Link
                href={sendHref}
                prefetch={false}
                className="inline-flex h-[48px] items-center justify-center gap-2 rounded-[15px] border border-[#efb5af] bg-[#fff5f3] text-[14px] font-black text-[#bd1e24]"
              >
                <Send className="h-5 w-5 fill-[#bd1e24]/10" strokeWidth={2.4} />
                Kirim
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <Link
          href={catalogHref}
          prefetch={false}
          className="relative block aspect-[953/242] overflow-hidden rounded-[18px] shadow-[0_18px_34px_rgba(147,36,24,0.18)]"
        >
          <Image
            src={`${assetBase}/03_banner/hero_banner_full.png`}
            alt="Semua kebutuhan dalam satu aplikasi LajuTopup"
            fill
            sizes="(max-width: 768px) 100vw, 390px"
            className="object-cover"
            priority
          />
        </Link>
      </section>

      <section className="mt-4 px-4">
        <div className="rounded-[22px] bg-white px-3 py-4 shadow-[0_14px_30px_rgba(42,26,23,0.08)] ring-1 ring-slate-950/[0.04]">
          <div className="grid grid-cols-4 gap-x-2 gap-y-5 min-[380px]:grid-cols-6">
            {services.map((service) => (
              <Link
                key={service.label}
                href={pathFor(service.key, variant)}
                prefetch={false}
                className="group flex min-w-0 flex-col items-center gap-2 text-center"
              >
                <span className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[16px] transition group-hover:-translate-y-0.5 min-[380px]:h-[58px] min-[380px]:w-[58px]">
                  <Image
                    src={service.icon}
                    alt=""
                    fill
                    sizes="58px"
                    className="object-cover"
                  />
                </span>
                <span className="max-w-[64px] text-[12px] font-semibold leading-tight text-slate-950">
                  {service.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-[18px] font-black tracking-tight text-slate-950">
            <Flame className="h-5 w-5 fill-[#e51d26] text-[#e51d26]" />
            Promo Spesial
          </h2>
          <Link href={catalogHref} prefetch={false} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500">
            Lihat Semua
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {promos.map((promo) => (
            <Link
              key={promo.label}
              href={promo.label === "Harga lebih murah" ? pulsaDataHref : catalogHref}
              prefetch={false}
              className="relative aspect-[297/142] overflow-hidden rounded-[10px] shadow-[0_10px_22px_rgba(130,39,30,0.09)]"
            >
              <Image
                src={promo.image}
                alt={promo.label}
                fill
                sizes="33vw"
                className="object-cover"
              />
            </Link>
          ))}
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
