'use client'

export interface LLMPromptResponse {
  prompt: string
  error: string | null
}

export class LLMService {
  private static instance: LLMService
  private apiKey: string | null = null

  private constructor() {
    // You can set your OpenAI API key here or via environment variables
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || null
  }

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService()
    }
    return LLMService.instance
  }

  async generateDailyPrompt(): Promise<LLMPromptResponse> {
    try {
      // If no API key, use fallback prompts
      if (!this.apiKey) {
        console.log('No LLM API key found, using fallback prompts')
        return this.getFallbackPrompt()
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
              content: `Generate a gamified gratitude quest for today (${new Date().toLocaleDateString()}, ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}). Make it feel like an exciting mission that someone would want to complete! Consider the day of the week and season in your prompt.`
            }
          ],
          max_tokens: 150,
          temperature: 0.9
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const prompt = data.choices[0]?.message?.content?.trim()

      if (!prompt) {
        throw new Error('No prompt generated')
      }

      return { prompt, error: null }

    } catch (error) {
      console.error('LLM prompt generation failed:', error)
      return this.getFallbackPrompt()
    }
  }

  private getFallbackPrompt(): LLMPromptResponse {
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

    return {
      prompt: fallbackPrompts[promptIndex],
      error: null
    }
  }

  // Alternative: Use a free service like Hugging Face
  async generatePromptWithHuggingFace(): Promise<LLMPromptResponse> {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You can add your Hugging Face token here if you have one
          'Authorization': 'Bearer hf_your_token_here'
        },
        body: JSON.stringify({
          inputs: "Generate a thoughtful gratitude prompt:",
          parameters: {
            max_new_tokens: 50,
            temperature: 0.8
          }
        })
      })

      if (!response.ok) {
        throw new Error('Hugging Face API error')
      }

      const data = await response.json()
      const prompt = data[0]?.generated_text?.trim()

      if (!prompt) {
        throw new Error('No prompt generated')
      }

      return { prompt, error: null }

    } catch (error) {
      console.error('Hugging Face prompt generation failed:', error)
      return this.getFallbackPrompt()
    }
  }
}

export const llmService = LLMService.getInstance()
