export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { replies } from "@/lib/db/schema"
import { nanoid } from "nanoid"
import Anthropic from "@anthropic-ai/sdk"
import { checkCanDraft, incrementDraftCount } from "@/lib/usage"

const anthropic = new Anthropic()

const TONE_PROMPTS: Record<string, string> = {
  professional: "professional and courteous",
  friendly: "warm, friendly, and approachable",
  formal: "formal and business-like",
  empathetic: "empathetic and understanding, acknowledging the customer's frustration",
  concise: "brief and to the point, no more than 3 sentences",
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const usage = await checkCanDraft(session.user.id)
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "limit_reached", count: usage.count, limit: usage.limit },
      { status: 402 },
    )
  }

  let customerMessage: string, tone: string
  try {
    const body = await request.json()
    customerMessage = (body.customerMessage ?? "").trim()
    tone = (body.tone ?? "professional").trim()
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (!customerMessage) return NextResponse.json({ error: "customer_message_required" }, { status: 400 })

  const toneDesc = TONE_PROMPTS[tone] ?? TONE_PROMPTS.professional

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are a customer service assistant helping a small business owner reply to customer messages. Write a ${toneDesc} reply to the following customer message. Write only the reply body — no subject line, no "Dear [Name]", no sign-off. Just the message body.

Customer message:
${customerMessage.slice(0, 3000)}`,
      },
    ],
  })

  const draft = message.content[0]?.type === "text" ? message.content[0].text.trim() : ""

  await db.insert(replies).values({
    id: nanoid(),
    userId: session.user.id,
    customerMessage,
    tone,
    draft,
    createdAt: new Date(),
  })

  await incrementDraftCount(session.user.id)

  return NextResponse.json({ draft })
}
