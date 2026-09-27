import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  ChevronRight,
  FileText,
  HelpCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getAppServerSession } from "@/lib/server-auth";
import { getUserProfile } from "@/lib/api.auth";
import { getInitials } from "@/components/user/helpers";
import type { UserSession } from "@/components/user/types";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserLogoutButton } from "@/components/user/UserLogoutButton";
import { UserProfilePhotoUploader } from "@/components/user/UserProfilePhotoUploader";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();
  return ["analyst", "operator", "operator kredit", "operator_kredit", "operator_credit", "operator-credit"].includes(value) ? "analis" : value;
}

function panelPathByRole(role: string) {
  if (role === "admin" || role === "staff") return "/dashboard/admin";
  if (role === "auditor") return "/dashboard/auditor";
  if (role === "member" || role === "agent_member" || role === "master_member") return "/dashboard/member";
  if (role === "analis") return "/dashboard/master/operator";
  if (role === "master" || role === "marketing") return "/dashboard/master";
  if (role === "operator_trx") return "/dashboard/operator";
  if (role === "operator_wallet") return "/dashboard/wallet";
  return "/user";
}

function panelDescriptionByRole(role: string) {
  if (role === "admin" || role === "staff") return "Masuk ke panel admin";
  if (role === "auditor") return "Masuk ke panel audit";
  if (role === "analis") return "Masuk ke panel operator kredit";
  if (role === "marketing") return "Menu kerja marketing tersedia di Akun";
  if (role === "master") return "Masuk ke panel master";
  if (role === "operator_trx") return "Masuk ke panel transaksi";
  if (role === "operator_wallet") return "Masuk ke panel wallet";
  if (role === "member" || role === "agent_member" || role === "master_member") return "Masuk ke panel H2H";
  return "Masuk ke aplikasi agent";
}

export default async function UserAccountPage() {
  const session = (await getAppServerSession()) as SessionShape | null;

  if (!session?.backendToken) {
    redirect("/login");
  }

  const user = session.user ?? null;
  const profile = session.backendToken ? await getUserProfile(session.backendToken) : null;
  const displayName = profile?.nama || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "-";
  const profileWithPhone = profile as typeof profile & { phone?: string; no_hp?: string; nomor_hp?: string; telepon?: string };
  const phone = profileWithPhone?.phone || profileWithPhone?.no_hp || profileWithPhone?.nomor_hp || profileWithPhone?.telepon || "-";
  const username = displayEmail !== "-" ? `@${displayEmail.split("@")[0]}` : "@lajutopup";
  const initials = getInitials(displayName, displayEmail);
  const profilePhotoURL = profile?.profile_photo_url || user?.image || "";
  const role = normalizeRole(profile?.role || user?.role);
  const canManageRetailNetwork = role === "master" || role === "agent";
  const canOpenWorkPanel = role !== "user" && role !== "agent" && role !== "marketing";

  const personalItems = [
    {
      label: "Nama lengkap",
      value: displayName,
      icon: UserRound,
    },
    {
      label: "Nomor handphone",
      value: phone,
      icon: Phone,
    },
    {
      label: "Email / Gmail",
      value: displayEmail,
      icon: Mail,
    },
  ];

  const settingItems = [
    ...(role === "marketing"
      ? [
          { href: "/user/account/tambah-agent", label: "Tambah Agent", desc: "Daftarkan agent baru dari lapangan", icon: UserPlus },
          { href: "/user/account/pengajuan-agent", label: "Pengajuan & Dokumen", desc: "Pantau dokumen pengajuan agent", icon: ClipboardList },
          { href: "/user/account/agent-binaan", label: "Agent Binaan", desc: "Lihat saldo dan aktivitas agent", icon: UsersRound },
        ]
      : []),
    ...(canOpenWorkPanel
      ? [
          {
            href: panelPathByRole(role),
            label: "Panel",
            desc: panelDescriptionByRole(role),
            icon: BriefcaseBusiness,
          },
        ]
      : []),
    ...(canManageRetailNetwork
      ? [
          {
            href: "/user/account/downline",
            label: role === "agent" ? "Tambah Member" : "Jaringan Retail",
            desc: role === "master" ? "Kelola agent dan user bawahan" : "Tambahkan member/user bawahan",
            icon: UsersRound,
          },
        ]
      : []),
    ...(role !== "marketing"
      ? [
          {
            href: "/user/account/security",
            label: "Keamanan Akun",
            desc: "Ganti password akun",
            icon: LockKeyhole,
          },
          {
            href: "/user/account",
            label: "Notifikasi",
            desc: "Atur informasi transaksi",
            icon: Bell,
          },
          {
            href: "/user/account",
            label: "Pusat Bantuan",
            desc: "FAQ dan layanan pelanggan",
            icon: HelpCircle,
          },
        ]
      : []),
    {
      href: "/kebijakan-privasi?from=account",
      label: "Syarat & Kebijakan",
      desc: "Ketentuan penggunaan LajuTopup",
      icon: FileText,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f4f3] pb-24">
      <section className="relative overflow-hidden rounded-b-[32px] bg-[radial-gradient(circle_at_90%_8%,rgba(255,183,43,0.82),transparent_32%),linear-gradient(135deg,#c91520_0%,#e83b1d_52%,#ff7b00_125%)] px-4 pb-8 pt-7 text-white shadow-[0_20px_44px_rgba(199,29,35,0.24)]">
        <div className="pointer-events-none absolute -left-14 -top-16 h-40 w-40 rounded-full border border-white/15 bg-white/10" />
        <div className="pointer-events-none absolute -right-10 top-7 h-32 w-32 rounded-full bg-white/12" />
        <div className="pointer-events-none absolute left-[36%] top-20 h-24 w-80 -rotate-12 rounded-[50%] bg-[#8d1519]/16" />
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <UserProfilePhotoUploader
            name={displayName}
            email={displayEmail}
            phone={phone}
            initials={initials}
            profilePhotoURL={profilePhotoURL}
          />
          <h1 className="mt-4 max-w-full truncate text-lg font-black tracking-tight">{displayName}</h1>
          <p className="mt-0.5 max-w-full truncate text-[11px] font-bold text-white/75">{username}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black text-white ring-1 ring-white/15">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
            Akun LajuTopup aktif
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-4 w-full max-w-md space-y-3.5 px-4">
        <section className="overflow-hidden rounded-[22px] border border-[#f1d8d5] bg-white shadow-[0_16px_36px_rgba(109,33,25,0.08)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <h2 className="text-sm font-black text-slate-950">Informasi Pribadi</h2>
            <Link href="/user/account/edit" className="text-[10px] font-black text-[#ef1d2b]">Edit</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {personalItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
                  <Icon className="h-5 w-5 shrink-0 text-[#ef1d2b]" strokeWidth={1.9} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400">{item.label}</p>
                    <p className="mt-0.5 truncate text-xs font-black text-slate-950">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-[#f1d8d5] bg-white shadow-[0_16px_36px_rgba(109,33,25,0.08)]">
          <div className="divide-y divide-slate-100">
            {settingItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#fff5f3]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff1ed] text-[#ef1d2b]">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-slate-950">{item.label}</span>
                    <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[18px] border border-rose-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <UserLogoutButton className="h-12 w-full rounded-2xl border border-rose-200 bg-white text-xs font-black text-rose-600 shadow-none hover:bg-rose-50 hover:text-rose-700" />
        </section>

        <p className="pt-2 text-center text-[10px] font-semibold text-slate-400">LajuTopup versi 1.0.0</p>
      </div>

      <UserBottomNav />
    </main>
  );
}
