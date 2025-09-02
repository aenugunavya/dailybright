import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing prompts table...')
    
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Try to read existing prompts
    const { data: prompts, error: queryError } = await supabase
      .from('prompts')
      .select('id, text, tags, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (queryError) {
      console.error('❌ Query error:', queryError)
      return NextResponse.json({ 
        error: 'Failed to query prompts',
        details: queryError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Query successful, found prompts:', prompts?.length || 0)
    
    return NextResponse.json({
      success: true,
      promptsCount: prompts?.length || 0,
      prompts: prompts || [],
      message: 'Successfully queried prompts table'
    })
    
  } catch (error) {
    console.error('💥 Test error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
