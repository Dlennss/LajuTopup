import { getAppServerSession } from "@/lib/server-auth";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { H2HRCatalogBrands } from "@/components/shared/H2HRCatalogBrands";
import { ServiceDirectory } from "@/components/shared/ServiceDirectory";
import { getCategories } from "@/lib/api.products";
import type { UserCategoryItem } from "@/components/user/types";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ layanan?: string }> }) {
  const session = await getAppServerSession();
  const token = (session as { backendToken?: string } | null)?.backendToken;
  const key = (await searchParams).layanan;
  return <main className="min-h-screen bg-zinc-50">
    {token ? <UserAuthClientSync backendToken={token} /> : null}
    {key ? <H2HRCatalogBrands categoryKey={key} mode="user" /> : <div className="px-4 py-4"><ServiceDirectory categories={await getCategories() as UserCategoryItem[]} mode="user" /></div>}
    <UserBottomNav />
  </main>;
}
