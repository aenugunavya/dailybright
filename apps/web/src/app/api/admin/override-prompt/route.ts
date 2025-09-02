import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Quick admin endpoint to override today's prompt immediately
export async function POST(request: NextRequest) {
  console.log('🔧 Admin: Overriding today\'s prompt')
  
  try {
    const body = await request.json()
    const { promptText, secret } = body
    
    // Simple authentication using the same cron secret
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!promptText) {
      return NextResponse.json({ error: 'promptText is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // First, create the new prompt in the prompts table
    const { data: newPrompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        text: promptText,
        tags: ['daily', 'admin-override']
      })
      .select()
      .single()
    
    if (promptError) {
      console.error('❌ Error creating new prompt:', promptError)
      return NextResponse.json({ 
        error: 'Failed to create new prompt', 
        details: promptError.message 
      }, { status: 500 })
    }
    
    // Check if today's daily_prompt exists
    const { data: existingDailyPrompt, error: fetchError } = await supabase
      .from('daily_prompts')
      .select('id')
      .eq('date', today)
      .single()
    
    if (existingDailyPrompt) {
      // Update existing daily prompt to point to new prompt
      const { error: updateError } = await supabase
        .from('daily_prompts')
        .update({ 
          prompt_id: newPrompt.id,
          scheduled_time: '00:00:00' // Release immediately
        })
        .eq('id', existingDailyPrompt.id)
      
      if (updateError) {
        console.error('❌ Error updating daily prompt:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update daily prompt', 
          details: updateError.message 
        }, { status: 500 })
      }
    } else {
      // Create new daily prompt entry
      const { error: createError } = await supabase
        .from('daily_prompts')
        .insert({
          date: today,
          prompt_id: newPrompt.id,
          scheduled_time: '00:00:00' // Release immediately
        })
      
      if (createError) {
        console.error('❌ Error creating daily prompt:', createError)
        return NextResponse.json({ 
          error: 'Failed to create daily prompt', 
          details: createError.message 
        }, { status: 500 })
      }
    }
    
    console.log('✅ Successfully overrode today\'s prompt')
    
    return NextResponse.json({
      success: true,
      message: 'Today\'s prompt overridden successfully',
      prompt: {
        id: newPrompt.id,
        text: newPrompt.text,
        date: today,
        overridden_at: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Admin prompt override error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to override prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
