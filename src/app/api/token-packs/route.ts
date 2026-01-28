import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET — list active token packs (public, no auth required)
export async function GET() {
  try {
    const packs = await prisma.tokenPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        tokenAmount: true,
        priceEurCents: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Error fetching token packs:", error);
    return NextResponse.json(
      { error: "Failed to fetch token packs" },
      { status: 500 }
    );
  }
}
