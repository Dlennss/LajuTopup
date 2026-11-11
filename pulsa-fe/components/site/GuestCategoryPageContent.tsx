import { getAppServerSession } from "@/lib/server-auth";
import { GuestBottomNav } from "@/components/guest/GuestBottomNav";
import { H2HRCatalogBrands } from "@/components/shared/H2HRCatalogBrands";

export async function GuestCategoryPageContent({ title }: { kategoriId: string; title: string }) {
  const session = await getAppServerSession();
  return <main className="min-h-screen bg-zinc-50">
    <H2HRCatalogBrands categoryKey={title} mode="guest" />
    <GuestBottomNav isLoggedIn={!!(session as { backendToken?: string } | null)?.backendToken} />
  </main>;
}
