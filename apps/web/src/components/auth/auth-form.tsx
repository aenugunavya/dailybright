'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AuthFormProps {
  mode?: 'signin' | 'signup'
}

export function AuthForm({ mode = 'signin' }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(mode === 'signup')
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // Redirect to dashboard after successful signin
        window.location.href = '/dashboard/today'
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      setMessage(error.message)
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <form onSubmit={handleAuth} className="space-y-5">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-medium">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        onClick={handleGoogleAuth}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        Continue with Google
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-accent hover:text-accent/80 hover:underline transition-colors font-medium"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>

      {message && (
        <div className={`text-center text-sm p-3 rounded-2xl ${
          message.includes('error') || message.includes('Error') 
            ? 'text-destructive bg-destructive/10 border border-destructive/20' 
            : 'text-nature-600 bg-nature-50 border border-nature-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
