import { getAppServerSession } from "@/lib/server-auth";
import { GuestBottomNav } from "@/components/guest/GuestBottomNav";
import { H2HRCatalogBrands } from "@/components/shared/H2HRCatalogBrands";
import { ServiceDirectory } from "@/components/shared/ServiceDirectory";
import { getCategories } from "@/lib/api.products";
import type { UserCategoryItem } from "@/components/user/types";


export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ layanan?: string }> }) {
  const session = await getAppServerSession();
  const token = (session as { backendToken?: string } | null)?.backendToken;
  const key = (await searchParams).layanan;
  return <main className="min-h-screen bg-zinc-50">
    {key ? <H2HRCatalogBrands categoryKey={key} mode="guest" /> : <div className="px-4 py-4"><ServiceDirectory categories={await getCategories() as UserCategoryItem[]} mode="guest" /></div>}
    <GuestBottomNav isLoggedIn={!!token} />
  </main>;
}
