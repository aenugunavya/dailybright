import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding prompts database...')
    
    // Use service client to bypass RLS for seeding
    const serviceClient = await createServiceClient()
    
    const prompts = [
      { text: 'What are you grateful for today? Share something that brought you joy or made you smile.', tags: ['daily', 'simple'] },
      { text: 'In exactly 5 words, describe your day\'s emotional soundtrack 🎵', tags: ['daily', 'creative'] },
      { text: 'If your day was a color, what would it be and why?', tags: ['daily', 'creative'] },
      { text: 'What superpower did you accidentally use today without realizing it?', tags: ['daily', 'fun'] },
      { text: 'Rate your day like a video game: What was your biggest XP gain?', tags: ['daily', 'gaming'] },
      { text: 'If today was a movie genre, what would it be called?', tags: ['daily', 'creative'] },
      { text: 'What invisible thing deserves a thank-you note from you today?', tags: ['daily', 'thoughtful'] },
      { text: 'Your day as a weather forecast: What was the emotional climate? ⛅', tags: ['daily', 'creative'] },
      { text: 'If you could time-travel and high-five your past self, when would it be?', tags: ['daily', 'fun'] },
      { text: 'What secret ingredient made today better than yesterday?', tags: ['daily', 'thoughtful'] },
      { text: 'Rate your day\'s plot twists from 1-10. What was the best one?', tags: ['daily', 'fun'] },
      { text: 'If your gratitude had a flavor today, what would you taste?', tags: ['daily', 'creative'] },
      { text: 'What background character in your life deserves the spotlight today?', tags: ['daily', 'thoughtful'] },
      { text: 'Your day\'s energy level: solar panel or dead battery? Why?', tags: ['daily', 'fun'] },
      { text: 'If today was a song, what would be its title and genre?', tags: ['daily', 'creative'] },
      { text: 'What tiny miracle went completely unnoticed by everyone else today?', tags: ['daily', 'thoughtful'] },
      { text: 'In 3 words, describe what your future self would thank you for', tags: ['daily', 'simple'] },
      { text: 'What invisible force field protected your mood today? 🛡️', tags: ['daily', 'fun'] },
      { text: 'If your day was a text message, what emoji combo would it be?', tags: ['daily', 'creative'] },
      { text: 'What ordinary thing became extraordinary for exactly 30 seconds today?', tags: ['daily', 'thoughtful'] },
      { text: 'Rate today\'s surprise level: predictable sitcom or plot-twist thriller?', tags: ['daily', 'fun'] }
    ]
    
    console.log(`🌱 Inserting ${prompts.length} prompts...`)
    
    const { data, error } = await serviceClient
      .from('prompts')
      .insert(prompts)
      .select()
    
    if (error) {
      console.error('❌ Seed error:', error)
      return NextResponse.json({ 
        error: 'Failed to seed prompts',
        details: error.message 
      }, { status: 500 })
    }
    
    console.log(`✅ Successfully seeded ${data?.length || 0} prompts`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${data?.length || 0} prompts`,
      prompts: data
    })
    
  } catch (error) {
    console.error('💥 Seed error:', error)
    return NextResponse.json(
      { 
        error: 'Seed failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
