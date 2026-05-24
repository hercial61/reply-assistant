import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { replies } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { DeleteButton } from "./delete-button"

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  friendly: "Friendly",
  formal: "Formal",
  empathetic: "Empathetic",
  concise: "Concise",
}

export default async function HistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const rows = await db
    .select()
    .from(replies)
    .where(eq(replies.userId, session.user.id))
    .orderBy(desc(replies.createdAt))

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto w-full">
      <h1 className="text-lg font-semibold text-zinc-900 mb-6">History</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">No replies drafted yet. Go to New reply to get started.</p>
      ) : (
        <div className="space-y-6">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {TONE_LABELS[row.tone] ?? row.tone}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(row.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </div>
                <DeleteButton id={row.id} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-zinc-600 line-clamp-4 whitespace-pre-line">{row.customerMessage}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Reply</p>
                  <p className="text-zinc-800 line-clamp-4 whitespace-pre-line">{row.draft}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
