import Image from "next/image";
import Link from "next/link";
import { Building2, ChevronLeft } from "lucide-react";
import { getBrandsByKategori, getCategories } from "@/lib/api.products";
import { matchingH2HRCategories } from "@/lib/h2hr-categories";
import { getBrandLogo } from "@/lib/brand-logos";
import type { UserCategoryItem } from "@/components/user/types";
import { notFound } from "next/navigation";

export async function H2HRCatalogBrands({ categoryKey, mode }: { categoryKey: string; mode: "user" | "guest" }) {
  const categories = matchingH2HRCategories(await getCategories() as UserCategoryItem[], categoryKey);
  if (!categories.length) notFound();
  const prefix = mode === "user" ? "/user" : "";
  const sections = await Promise.all(categories.map(async (category) => ({ category, brands: await getBrandsByKategori(String(category.id)) })));
  return <div className="space-y-6 px-4 py-4 pb-28">
    <Link href={`${prefix}/kategori`} className="inline-flex items-center gap-1 text-sm text-zinc-600"><ChevronLeft className="h-4 w-4" /> Semua layanan</Link>
    {sections.map(({ category, brands }) => <section key={category.id} className="space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">{category.nama}</h1>
      <div className="grid grid-cols-3 gap-3">
        {brands.map((brand) => {
          const logo = getBrandLogo(brand.nama);
          return <Link key={brand.id} href={`${prefix}/kategori/${category.id}/brand/${brand.id}`} className="flex min-w-0 flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-center hover:border-red-300">
            <span className="flex h-16 w-full items-center justify-center">
              {logo ? <Image src={logo.src} alt={logo.alt} width={96} height={64} className="h-full w-full object-contain" /> : <Building2 aria-hidden className="h-8 w-8 text-zinc-400" />}
            </span>
            <span className="w-full break-words text-xs font-semibold text-zinc-800">{brand.nama}</span>
          </Link>;
        })}
      </div>
      {!brands.length && <p className="text-sm text-zinc-500">Belum ada produk aktif.</p>}
    </section>)}
  </div>;
}
