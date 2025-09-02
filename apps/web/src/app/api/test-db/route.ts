import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test regular client
    const supabase = await createClient()
    console.log('✅ Regular client created')
    
    // Test service client
    const serviceClient = await createServiceClient()
    console.log('✅ Service client created')
    
    // Test basic query
    const { data: prompts, error: queryError } = await serviceClient
      .from('prompts')
      .select('id, text')
      .limit(5)
    
    if (queryError) {
      console.error('❌ Query error:', queryError)
      return NextResponse.json({ 
        error: 'Database query failed',
        details: queryError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Query successful, found prompts:', prompts?.length || 0)
    
    // Test insert (this should work with service client)
    const { data: newPrompt, error: insertError } = await serviceClient
      .from('prompts')
      .insert({
        text: 'Test prompt for debugging',
        tags: ['test', 'debug']
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return NextResponse.json({ 
        error: 'Database insert failed',
        details: insertError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Insert successful, new prompt ID:', newPrompt.id)
    
    // Clean up test data
    await serviceClient
      .from('prompts')
      .delete()
      .eq('id', newPrompt.id)
    
    console.log('✅ Test prompt cleaned up')
    
    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      promptsCount: prompts?.length || 0,
      testPromptId: newPrompt.id
    })
    
  } catch (error) {
    console.error('💥 Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
