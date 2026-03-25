"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabaseClient"

interface UseSupabaseQueryOptions<T> {
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<{ data: T | null; error: unknown }>
  enabled?: boolean
}

interface UseSupabaseQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T>({
  queryFn,
  enabled = true,
}: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error } = await queryFnRef.current(supabase)
      if (error) {
        setError(typeof error === "string" ? error : (error as { message?: string }).message ?? "An error occurred")
      } else {
        setData(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      refetch()
    } else {
      setLoading(false)
    }
  }, [enabled, refetch])

  return { data, loading, error, refetch }
}
