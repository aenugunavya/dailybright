import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to manually trigger prompt generation (for development/testing)
export async function POST(request: NextRequest) {
  console.log('🧪 Test prompt generation called')
  
  try {
    // In production, you might want to protect this endpoint too
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment) {
      // For production, require authentication
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    // Call our cron endpoint internally
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const cronResponse = await fetch(`${baseUrl}/api/cron/daily-prompt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })
    
    const cronData = await cronResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Prompt generation triggered successfully',
      cron_response: cronData,
      environment: process.env.NODE_ENV
    })
    
  } catch (error) {
    console.error('❌ Test prompt generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger prompt generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
