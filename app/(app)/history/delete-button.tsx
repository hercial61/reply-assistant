"use client"
import { useRouter } from "next/navigation"

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    await fetch(`/api/replies/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
    >
      Delete
    </button>
  )
}
