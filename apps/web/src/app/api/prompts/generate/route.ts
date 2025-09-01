import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    // Generate prompt using OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    let promptText = ''
    let debugInfo = {
      hasApiKey: !!openaiApiKey,
      keyPrefix: openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'none'
    }
    
    if (openaiApiKey) {
      try {
        // Get recent prompts to avoid duplicates
        const { data: recentPrompts } = await supabase
          .from('prompts')
          .select('text')
          .order('created_at', { ascending: false })
          .limit(30) // Check last 30 prompts

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
                content: `You are a master game designer for "GratiTime" - the world's most creative gratitude app. Your job is to create WILDLY CREATIVE, FUN, and UNEXPECTED daily challenges that make people excited to share their gratitude.

                🚨 AVOID BORING PROMPTS AT ALL COSTS:
                ❌ "What are you grateful for today?"
                ❌ "What made you smile?"
                ❌ "Who are you thankful for?"
                ❌ "What brought you joy?"

                🎨 CREATE ULTRA-CREATIVE PROMPTS LIKE THESE:
                ✅ "In exactly 5 words, describe your day's emotional soundtrack"
                ✅ "If your day was a color, what would it be and why?"
                ✅ "What superpower did you accidentally use today without realizing it?"
                ✅ "Rate your day like a video game: What was your biggest XP gain?"
                ✅ "If today was a movie genre, what would it be called?"
                ✅ "What invisible thing deserves a thank-you note from you today?"
                ✅ "Your day as a weather forecast: What was the emotional climate?"
                ✅ "If you could time-travel and high-five your past self, when would it be?"
                ✅ "What secret ingredient made today better than yesterday?"
                ✅ "Rate your day's plot twists from 1-10. What was the best one?"

                🎮 CREATIVE FORMATS TO USE:
                - **Word limits**: "In 3 words...", "Using only 7 words..."
                - **Metaphors**: "If your day was a [animal/food/song/color]..."
                - **Ratings**: "Rate your day's [emotion] from 1-10..."
                - **Time travel**: "Tell your past/future self about..."
                - **Superpowers**: "What hidden ability did you discover..."
                - **Game mechanics**: "What achievement did you unlock..."
                - **Sensory**: "What sound/smell/texture surprised you..."
                - **Storytelling**: "If today was a [movie/book/song]..."
                - **Magic**: "What invisible force helped you today..."
                - **Mysteries**: "What small miracle went unnoticed..."

                🎯 PROMPT CATEGORIES (be SUPER creative in each):
                1. **Micro-Moments**: Tiny wins, split-second joys, brief connections
                2. **Invisible Gratitude**: Things we never notice (air, gravity, WiFi)
                3. **Sensory Surprises**: Unexpected tastes, sounds, textures
                4. **Emotional Weather**: Feelings as weather patterns/temperatures
                5. **Time Puzzles**: Past/future connections, temporal gratitude
                6. **Secret Powers**: Hidden strengths, unconscious skills
                7. **Plot Twists**: Unexpected turns, surprise discoveries
                8. **Energy Sources**: What recharged/drained/boosted you
                9. **Behind the Scenes**: Invisible helpers, background support
                10. **Upgrade Moments**: When you leveled up without noticing

                📏 FORMAT REQUIREMENTS:
                - 8-20 words maximum
                - Include 1 emoji maximum
                - Make it feel like a creative writing prompt
                - Create instant curiosity and engagement
                - Use unconventional angles and perspectives
                - Make people think "Ooh, that's interesting!"

                Return ONLY the prompt text - no quotes, explanations, or extra formatting.`
              },
              {
                role: 'user',
                content: `Generate a gamified gratitude quest for today (${new Date().toLocaleDateString()}, ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}). Make it feel like an exciting mission that someone would want to complete! Consider the day of the week and season in your prompt.

                🚫 AVOID these recently used prompts (don't create anything similar):
                ${recentPromptTexts.slice(0, 10).map(text => `- "${text}"`).join('\n')}

                Create something completely fresh and different!`
              }
            ],
            max_tokens: 150,
            temperature: 0.9
          })
        })

        if (response.ok) {
          const data = await response.json()
          promptText = data.choices[0]?.message?.content?.trim()
        }
      } catch (error) {
        console.error('OpenAI API error:', error)
      }
    }

    // Fallback to curated prompts if LLM fails
    if (!promptText) {
      const fallbackPrompts = [
        "In exactly 5 words, describe your day's emotional soundtrack 🎵",
        "If your day was a color, what would it be and why?",
        "What superpower did you accidentally use today without realizing it?",
        "Rate your day like a video game: What was your biggest XP gain?",
        "If today was a movie genre, what would it be called?",
        "What invisible thing deserves a thank-you note from you today?",
        "Your day as a weather forecast: What was the emotional climate? ⛅",
        "If you could time-travel and high-five your past self, when would it be?",
        "What secret ingredient made today better than yesterday?",
        "Rate your day's plot twists from 1-10. What was the best one?",
        "If your gratitude had a flavor today, what would you taste?",
        "What background character in your life deserves the spotlight today?",
        "Your day's energy level: solar panel or dead battery? Why?",
        "If today was a song, what would be its title and genre?",
        "What tiny miracle went completely unnoticed by everyone else today?",
        "In 3 words, describe what your future self would thank you for",
        "What invisible force field protected your mood today? 🛡️",
        "If your day was a text message, what emoji combo would it be?",
        "What ordinary thing became extraordinary for exactly 30 seconds today?",
        "Rate today's surprise level: predictable sitcom or plot-twist thriller?"
      ]

      const today = new Date()
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
      const promptIndex = dayOfYear % fallbackPrompts.length
      promptText = fallbackPrompts[promptIndex]
    }

    // Store the generated prompt in the database
    const { data: newPrompt, error } = await supabase
      .from('prompts')
      .insert({
        text: promptText,
        tags: ['daily', 'generated', 'ai']
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to store prompt' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      prompt: newPrompt,
      generated_by: openaiApiKey ? 'ai' : 'fallback',
      debug: debugInfo
    })

  } catch (error) {
    console.error('Prompt generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    )
  }
}
