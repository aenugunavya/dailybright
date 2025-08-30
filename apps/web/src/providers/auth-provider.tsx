'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Initialize Supabase client
    try {
      const client = createClient()
      setSupabase(client)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Supabase')
      setLoading(false)
      return
    }
  }, [])

  useEffect(() => {
    if (!supabase || error) {
      setLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (err) {
        setError('Failed to get session')
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // Store timezone on first login
        if (event === 'SIGNED_IN' && session?.user) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
          
          try {
            // Check if user already has timezone set
            const { data: existingUser } = await supabase
              .from('users')
              .select('tz')
              .eq('id', session.user.id)
              .single()

            if (!existingUser?.tz) {
              // Update user with timezone
              await supabase
                .from('users')
                .upsert({
                  id: session.user.id,
                  email: session.user.email!,
                  tz: timezone,
                  updated_at: new Date().toISOString(),
                })
                .select()
            }
          } catch (err) {
            console.error('Failed to update user timezone:', err)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, error])

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  // Show error state if Supabase isn't configured
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-gray-100 rounded-lg p-4 text-left">
            <p className="text-sm font-medium mb-2">Quick Setup:</p>
            <ol className="text-xs text-gray-700 space-y-1">
              <li>1. Create a Supabase project at <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a></li>
              <li>2. Get your Project URL and API Key</li>
              <li>3. Update your .env.local file</li>
              <li>4. Restart the dev server</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
