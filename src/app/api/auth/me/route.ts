import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah berakhir." }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Gagal memverifikasi pengguna." }, { status: 500 });
  }
}
