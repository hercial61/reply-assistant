export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { replies } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

type RouteCtx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await params
  const [deleted] = await db
    .delete(replies)
    .where(and(eq(replies.id, id), eq(replies.userId, session.user.id)))
    .returning()

  if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
