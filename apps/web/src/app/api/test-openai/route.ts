import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not found in environment variables',
        hasKey: false
      })
    }

    // Test a simple OpenAI API call
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
            content: 'Generate a wildly creative gratitude prompt that would make people excited to respond!'
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json({
        success: false,
        error: `OpenAI API error: ${response.status} - ${errorData}`,
        hasKey: true,
        keyPrefix: openaiApiKey.substring(0, 7) + '...'
      })
    }

    const data = await response.json()
    const prompt = data.choices[0]?.message?.content?.trim()

    return NextResponse.json({
      success: true,
      prompt,
      hasKey: true,
      keyPrefix: openaiApiKey.substring(0, 7) + '...',
      model: 'gpt-4o-mini',
      test_time: new Date().toISOString()
    })

  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        test_time: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
