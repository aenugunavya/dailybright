import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get today's daily prompt
export async function GET(request: NextRequest) {
  console.log('📅 Fetching today\'s daily prompt')
  
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
    }

    if (!user) {
      console.log('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }
    
    // Use our database function to get today's prompt
    const { data: todaysPrompt, error: promptError } = await supabase
      .rpc('get_todays_prompt')
    
    if (promptError) {
      console.error('❌ Error fetching today\'s prompt:', promptError)
      return NextResponse.json({ 
        error: 'Failed to fetch today\'s prompt',
        details: promptError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Today\'s prompt retrieved:', todaysPrompt?.has_prompt ? 'Found' : 'None')
    
    if (!todaysPrompt?.has_prompt) {
      return NextResponse.json({
        success: true,
        has_prompt: false,
        message: 'No prompt available for today yet. Check back later!'
      })
    }
    
    // Check if user has already responded to today's prompt
    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id, created_at, text, photo_url')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .eq('prompt_id', todaysPrompt.prompt.id)
      .single()
    
    return NextResponse.json({
      success: true,
      has_prompt: true,
      prompt: todaysPrompt.prompt,
      daily_prompt_info: {
        id: todaysPrompt.daily_prompt_id,
        date: todaysPrompt.date,
        generated_at: todaysPrompt.generated_at,
        scheduled_time: todaysPrompt.scheduled_time
      },
      user_response: existingEntry ? {
        id: existingEntry.id,
        text: existingEntry.text,
        photo_url: existingEntry.photo_url,
        created_at: existingEntry.created_at,
        has_responded: true
      } : {
        has_responded: false
      }
    })
    
  } catch (error) {
    console.error('❌ Daily prompt fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch daily prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow users to create/update their response to today's prompt
export async function POST(request: NextRequest) {
  console.log('📝 Creating response to today\'s prompt')
  
  try {
    const body = await request.json()
    const { text, photo_url } = body
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 })
    }
    
    if (text.length > 2000) {
      return NextResponse.json({ error: 'Response text too long (max 2000 characters)' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get today's prompt
    const { data: todaysPrompt } = await supabase.rpc('get_todays_prompt')
    
    if (!todaysPrompt?.has_prompt) {
      return NextResponse.json({ 
        error: 'No prompt available for today' 
      }, { status: 400 })
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    // Check if user already has an entry for today
    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('prompt_id', todaysPrompt.prompt.id)
      .single()
    
    let result
    
    if (existingEntry) {
      // Update existing entry
      const { data: updatedEntry, error: updateError } = await supabase
        .from('entries')
        .update({
          text: text.trim(),
          photo_url: photo_url || null
        })
        .eq('id', existingEntry.id)
        .eq('user_id', user.id) // Security check
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Error updating entry:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update response',
          details: updateError.message 
        }, { status: 500 })
      }
      
      result = updatedEntry
      console.log('✅ Entry updated successfully')
      
    } else {
      // Create new entry
      const { data: newEntry, error: createError } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          date: today,
          prompt_id: todaysPrompt.prompt.id,
          text: text.trim(),
          photo_url: photo_url || null,
          on_time: true // Since they're responding to today's prompt
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating entry:', createError)
        return NextResponse.json({ 
          error: 'Failed to create response',
          details: createError.message 
        }, { status: 500 })
      }
      
      result = newEntry
      console.log('✅ Entry created successfully')
    }
    
    return NextResponse.json({
      success: true,
      entry: result,
      prompt: todaysPrompt.prompt
    })
    
  } catch (error) {
    console.error('❌ Response creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
