import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { laugh: { increment: 1 } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Error updating laugh:", err);
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
