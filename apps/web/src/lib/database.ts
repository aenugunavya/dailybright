import { createClient } from '@/lib/supabase/client'
import { Database } from './types/database'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type UserInsert = Tables['users']['Insert']
type UserUpdate = Tables['users']['Update']
type DailyState = Tables['user_daily_state']['Row']
type Entry = Tables['entries']['Row']
type EntryInsert = Tables['entries']['Insert']
type Friend = Tables['friends']['Row']
type FriendInsert = Tables['friends']['Insert']

export class DatabaseService {
  constructor(private supabase: any) {}

  // User operations
  async createUserProfile(user: UserInsert): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert(user)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to create user profile' }
    }
  }

  async updateUserProfile(userId: string, updates: UserUpdate): Promise<{ data: User | null; error: string | null }> {
    try {
      // First check if user profile exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (!existingUser) {
        // Create profile if it doesn't exist
        const { data: user } = await this.supabase.auth.getUser()
        if (user.user && user.user.email) {
          const createResult = await this.createUserProfile({
            id: userId,
            email: user.user.email,
            ...updates
          })
          return createResult
        }
        return { data: null, error: 'User not found and cannot create profile' }
      }

      // Update existing profile
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to update user profile' }
    }
  }

  async getUserProfile(userId: string): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { data: null, error: 'User profile not found' }
        }
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to get user profile' }
    }
  }

  // Daily state operations
  async getTodayState(userId: string): Promise<{ data: DailyState | null; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('user_daily_state')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to get daily state' }
    }
  }

  async createTodayState(userId: string): Promise<{ data: DailyState | null; error: string | null }> {
    try {
      console.log('🔄 Creating today state for user:', userId)
      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Today\'s date:', today)
      
      // First check if a state already exists for today
      const { data: existingState } = await this.supabase
        .from('user_daily_state')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()
      
      if (existingState) {
        console.log('✅ Daily state already exists for today:', existingState.user_id)
        return { data: existingState, error: null }
      }
      
      // Use deterministic prompt selection based on date instead of fetching from database
      const promptId = this.getDeterministicPromptId()
      console.log('✨ Selected deterministic prompt ID:', promptId)

      // Generate random time for today (9 AM to 9 PM)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const randomHour = Math.floor(Math.random() * 12) + 9 // 9-20 (9 AM to 8 PM)
      const randomMinute = Math.floor(Math.random() * 60)
      
      const windowStart = new Date(todayStart)
      windowStart.setHours(randomHour, randomMinute, 0, 0)
      
      const windowEnd = new Date(windowStart)
      windowEnd.setHours(windowEnd.getHours() + 2) // 2 hour window

      console.log('⏰ Creating daily state with prompt ID:', promptId)
      const { data, error } = await this.supabase
        .from('user_daily_state')
        .insert({
          user_id: userId,
          date: today,
          prompt_id: promptId,
          window_start_ts: windowStart.toISOString(),
          window_end_ts: windowEnd.toISOString()
        })
        .select('*')
        .single()

      if (error) {
        return { data: null, error: error.message || 'Unknown database error' }
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to create daily state' }
    }
  }

  // Entry operations
  async createEntry(entry: EntryInsert): Promise<{ data: Entry | null; error: string | null }> {
    try {
      console.log('🔐 Creating entry with authenticated client...')
      console.log('🔐 Entry data:', entry)
      
      // Test if we can get the authenticated user
      const { data: { user: authUser } } = await this.supabase.auth.getUser()
      console.log('🔐 Authenticated user from client:', authUser?.id)
      
      const { data, error } = await this.supabase
        .from('entries')
        .insert(entry)
        .select()
        .single()

      if (error) {
        console.log('❌ Entry creation error:', error)
        return { data: null, error: error.message }
      }

      console.log('✅ Entry created successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.log('💥 Exception in createEntry:', error)
      return { data: null, error: 'Failed to create entry' }
    }
  }

  async getTodayEntry(userId: string): Promise<{ data: Entry | null; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to get today entry' }
    }
  }

  // Friend operations
  async searchUsers(query: string): Promise<{ data: User[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to search users' }
    }
  }

  async getFriendsRecentEntries(userId: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      // First get the user's friends
      const { data: friends } = await this.supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!friends || friends.length === 0) {
        return { data: [], error: null }
      }

      // Get friend IDs
      const friendIds = friends.map((friendship: any) => 
        friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      )

      // Get recent entries from friends (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await this.supabase
        .from('entries')
        .select(`
          *,
          users:user_id(id, email, display_name),
          prompts:prompt_id(id, text)
        `)
        .in('user_id', friendIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to get friends entries' }
    }
  }

  async getUserRecentEntries(userId: string, excludeDate?: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      let query = this.supabase
        .from('entries')
        .select(`
          *,
          prompts:prompt_id(id, text)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Exclude today's entry if date provided
      if (excludeDate) {
        query = query.neq('date', excludeDate)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to get recent entries' }
    }
  }

  async sendFriendRequest(userId: string, friendEmail: string): Promise<{ data: Friend | null; error: string | null }> {
    try {
      // First find the friend by email
      const { data: friendUser, error: findError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', friendEmail)
        .single()

      if (findError || !friendUser) {
        return { data: null, error: 'User not found' }
      }

      // Check if friendship already exists
      const { data: existingFriend } = await this.supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${userId})`)
        .single()

      if (existingFriend) {
        return { data: null, error: 'Friendship already exists' }
      }

      const { data, error } = await this.supabase
        .from('friends')
        .insert({
          user_id: userId,
          friend_id: friendUser.id,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to send friend request' }
    }
  }

  async getFriends(userId: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('friends')
        .select(`
          *,
          friend:users!friends_friend_id_fkey(id, email, display_name),
          user:users!friends_user_id_fkey(id, email, display_name)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to get friends' }
    }
  }

  async getPendingFriendRequests(userId: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('friends')
        .select(`
          *,
          sender:users!friends_user_id_fkey(id, email, display_name, profile_photo_url)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending')

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to get pending friend requests' }
    }
  }

  async updateFriendStatus(userId: string, friendId: string, status: 'accepted' | 'blocked'): Promise<{ data: Friend | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('friends')
        .update({ status })
        .eq('user_id', friendId)
        .eq('friend_id', userId)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to update friend status' }
    }
  }



  private getDeterministicPromptId(): number {
    // Use deterministic selection based on today's date
    // This approach avoids database queries and RLS issues entirely
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    
    // These are the prompt IDs that were seeded (91-111, total 21 prompts)
    const availablePromptIds = [91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]
    
    // Select a prompt based on the day of year
    const promptIndex = dayOfYear % availablePromptIds.length
    const selectedPromptId = availablePromptIds[promptIndex]
    
    console.log(`📅 Day ${dayOfYear} of year, selected prompt ${selectedPromptId} (index ${promptIndex} of ${availablePromptIds.length} available)`)
    
    return selectedPromptId
  }

  // Get today's prompt text directly using the deterministic selection
  getTodaysPromptText(): string {
    // Use the same deterministic logic but return the actual prompt text
    // This avoids any database/RLS issues entirely
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    
    // Hardcoded prompts from our seed data (in order 91-111)
    const prompts = [
      "What are you grateful for today? Share something that brought you joy or made you smile.",
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
    
    const promptIndex = dayOfYear % prompts.length
    const selectedPrompt = prompts[promptIndex]
    
    console.log(`📅 Day ${dayOfYear} of year, selected prompt: "${selectedPrompt.substring(0, 50)}..." (index ${promptIndex})`)
    
    return selectedPrompt
  }
}

// Factory function to create database service with authenticated client
export function createDatabaseService(supabaseClient: any) {
  return new DatabaseService(supabaseClient)
}

// For backward compatibility, but this won't work for authenticated operations
export const databaseService = new DatabaseService(createClient())


