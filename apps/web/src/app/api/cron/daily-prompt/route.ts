import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint will be called by Vercel Cron at random times each day
export async function POST(request: NextRequest) {
  console.log('🕐 Daily prompt cron job started')
  
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid cron authorization')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Create service role client for database operations
    const supabase = await createClient()
    
    // Check if we already have a prompt for today
    console.log('🔍 Checking for existing daily prompt...')
    const { data: existingPrompt } = await supabase
      .rpc('get_todays_prompt')
    
    if (existingPrompt?.has_prompt) {
      console.log('✅ Daily prompt already exists for today')
      return NextResponse.json({
        success: true,
        message: 'Daily prompt already exists',
        existing_prompt: existingPrompt.prompt
      })
    }
    
    // Generate a new prompt using OpenAI
    console.log('🤖 Generating new daily prompt...')
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not configured')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }
    
    let promptText = ''
    const today = new Date()
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
    const monthName = today.toLocaleDateString('en-US', { month: 'long' })
    const dayOfMonth = today.getDate()
    
    try {
      // Get recent prompts to avoid duplicates
      const { data: recentPrompts } = await supabase
        .from('prompts')
        .select('text')
        .order('created_at', { ascending: false })
        .limit(50) // Check more prompts for better uniqueness
      
      const recentPromptTexts = recentPrompts?.map(p => p.text.toLowerCase()) || []
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are the ultimate creative director for Daily Bright - a gamified gratitude app that makes gratitude journaling feel like an exciting adventure!
              
              🎯 YOUR MISSION: Create WILDLY creative, engaging daily prompts that make people excited to share their gratitude. Think of each prompt as a fun mini-game or creative challenge.

              🚨 STRICT REQUIREMENTS:
              - 8-25 words maximum
              - Include exactly 1 emoji (choose thoughtfully)
              - Make it feel like a game quest or creative writing challenge
              - Focus on UNIQUE perspectives and angles
              - Avoid generic gratitude language
              
              🎨 CREATIVE FORMATS TO USE:
              - **Metaphorical**: "If your day was a [song/color/weather/food]..."
              - **Gaming**: "What achievement did you unlock today?"
              - **Time Travel**: "What would you tell yesterday's you?"
              - **Sensory**: "What unexpected sound/smell/texture surprised you?"
              - **Storytelling**: "If today was a movie, what genre would it be?"
              - **Magic/Fantasy**: "What invisible superpower helped you today?"
              - **Rating/Scoring**: "Rate your day's plot twists from 1-10"
              - **Word Limits**: "In exactly 5 words, describe your day's energy"
              - **Mysteries**: "What small miracle went unnoticed today?"
              - **Energy/Elements**: "What recharged your soul like a battery today?"
              
              🔥 EXAMPLE AMAZING PROMPTS:
              ✅ "If your gratitude had a soundtrack today, what genre would it play? 🎵"
              ✅ "Rate your day's surprise level: sitcom predictable or thriller plot twist? 📺"
              ✅ "What invisible superhero secretly made your day better? 🦸"
              ✅ "In 4 words, describe the flavor of today's best moment 🍯"
              ✅ "If today was weather, what forecast would you give tomorrow? ⛅"
              
              ❌ AVOID THESE BORING PATTERNS:
              - "What are you grateful for today?"
              - "Who made you smile?"
              - "What brought you joy?"
              - Generic thankfulness questions
              
              Return ONLY the prompt text with one emoji - no quotes, explanations, or extra formatting.`
            },
            {
              role: 'user',
              content: `Create an exciting gratitude quest for ${dayName}, ${monthName} ${dayOfMonth}! 
              
              Consider:
              - Day of week: ${dayName} (adapt energy accordingly)
              - Season/time of year context
              - Make it feel fresh and different from typical gratitude prompts
              
              🚫 AVOID these recently used prompts (create something completely different):
              ${recentPromptTexts.slice(0, 15).map(text => `- "${text}"`).join('\n')}
              
              Create something that makes people think "Ooh, this is fun to answer!" 🎯`
            }
          ],
          max_tokens: 100,
          temperature: 0.95, // Higher creativity
          presence_penalty: 0.6, // Encourage novel responses
          frequency_penalty: 0.3
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        promptText = data.choices[0]?.message?.content?.trim()
        console.log('✅ Generated prompt:', promptText)
      } else {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
    } catch (error) {
      console.error('🤖 OpenAI generation failed:', error)
      // Fallback to creative curated prompts
      promptText = getRandomCreativePrompt(today)
      console.log('🔄 Using fallback prompt:', promptText)
    }
    
    if (!promptText) {
      throw new Error('Failed to generate prompt text')
    }
    
    // Generate random time for tomorrow (between 8 AM and 8 PM)
    const randomHour = Math.floor(Math.random() * 12) + 8 // 8-19 (8 AM to 7 PM)
    const randomMinute = Math.floor(Math.random() * 60)
    const scheduledTime = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:00`
    
    // Store the daily prompt using our database function
    const { data: createResult, error: createError } = await supabase
      .rpc('create_daily_prompt', {
        p_date: today.toISOString().split('T')[0], // YYYY-MM-DD format
        p_prompt_text: promptText,
        p_scheduled_time: scheduledTime
      })
    
    if (createError) {
      console.error('❌ Failed to create daily prompt:', createError)
      return NextResponse.json({ 
        error: 'Failed to store daily prompt',
        details: createError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Daily prompt created successfully:', createResult)
    
    return NextResponse.json({
      success: true,
      message: 'Daily prompt generated and scheduled',
      prompt: {
        text: promptText,
        scheduled_time: scheduledTime,
        date: today.toISOString().split('T')[0]
      },
      generated_by: 'ai',
      database_result: createResult
    })
    
  } catch (error) {
    console.error('❌ Daily prompt cron job failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate daily prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Fallback creative prompts if OpenAI fails
function getRandomCreativePrompt(date: Date): string {
  const creativePrompts = [
    "If your day was a video game, what achievement did you unlock? 🎮",
    "Rate today's plot twists from 1-10. What was the wildest one? 📚",
    "What invisible superpower secretly helped you today? 🦸",
    "If gratitude had a flavor today, what would you taste? 🍯",
    "Your day as a weather report: what was the emotional forecast? ⛅",
    "In exactly 5 words, describe your day's energy signature ⚡",
    "What background character in your life deserves the spotlight today? 🎭",
    "If today was a song, what would its title and genre be? 🎵",
    "What tiny miracle went completely unnoticed by everyone else? ✨",
    "Rate your day: solar panel charged or battery drained? Why? 🔋",
    "If your gratitude was a color, what shade would paint today? 🎨",
    "What secret ingredient made today better than yesterday? 🧂",
    "Your day's surprise level: predictable sitcom or thriller twist? 📺",
    "What ordinary thing became extraordinary for exactly 30 seconds? ⭐",
    "If today sent you a text, what emoji combo would it use? 💬",
    "What invisible force field protected your mood today? 🛡️",
    "In 3 words, describe what your future self would thank you for 🔮",
    "What background app was running in your happiness today? 📱",
    "If today was a movie genre, what would you call it? 🎬",
    "What unexpected sensory moment surprised your gratitude today? 👃"
  ]
  
  // Use date to ensure same prompt on same day
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  return creativePrompts[dayOfYear % creativePrompts.length]
}

// Allow this endpoint to be called by cron jobs
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
