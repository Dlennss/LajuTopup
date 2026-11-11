import { getAppServerSession } from "@/lib/server-auth";
import { GuestBottomNav } from "@/components/guest/GuestBottomNav";
import { H2HRCatalogBrands } from "@/components/shared/H2HRCatalogBrands";



export const dynamic = "force-dynamic";

export default async function CatalogPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAppServerSession();
  const token = (session as { backendToken?: string } | null)?.backendToken;
  const key = (await params).id;
  return <main className="min-h-screen bg-zinc-50">
    <H2HRCatalogBrands categoryKey={key} mode="guest" />
    <GuestBottomNav isLoggedIn={!!token} />
  </main>;
}
