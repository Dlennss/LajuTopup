import { getAppServerSession } from "@/lib/server-auth";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { H2HRCatalogBrands } from "@/components/shared/H2HRCatalogBrands";

import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAppServerSession();
  const token = (session as { backendToken?: string } | null)?.backendToken;
  const key = (await params).id;
  return <main className="min-h-screen bg-zinc-50">
    {token ? <UserAuthClientSync backendToken={token} /> : null}
    <H2HRCatalogBrands categoryKey={key} mode="user" />
    <UserBottomNav />
  </main>;
}
