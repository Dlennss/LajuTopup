import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Layanan ini sudah dihentikan. Pilih produk dari katalog H2HR." },
    { status: 410 },
  );
}
