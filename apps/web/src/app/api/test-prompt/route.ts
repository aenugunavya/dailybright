import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test the prompt generation
    const response = await fetch(`${request.nextUrl.origin}/api/prompts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      prompt: result.prompt?.text || 'No prompt generated',
      generated_by: result.generated_by || 'unknown',
      api_used: result.generated_by === 'ai' ? 'OpenAI GPT-4' : 'Fallback prompts',
      test_time: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test prompt generation error:', error)
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
