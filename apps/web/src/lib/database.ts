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
  private supabase = createClient()

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
        .select('*, prompts(*)')
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
      const today = new Date().toISOString().split('T')[0]
      
      // Try to get today's AI-generated prompt first
      let promptId = await this.getTodaysPromptId()
      
      if (!promptId) {
        // Generate a new prompt for today
        promptId = await this.generateTodaysPromptId()
      }
      
      if (!promptId) {
        // Fallback to random existing prompt
        const { data: prompts, error: promptError } = await this.supabase
          .from('prompts')
          .select('id')
          .limit(100)

        if (promptError || !prompts?.length) {
          return { data: null, error: 'Failed to get prompt' }
        }

        promptId = prompts[Math.floor(Math.random() * prompts.length)].id
      }

      // Generate random time for today (9 AM to 9 PM)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const randomHour = Math.floor(Math.random() * 12) + 9 // 9-20 (9 AM to 8 PM)
      const randomMinute = Math.floor(Math.random() * 60)
      
      const windowStart = new Date(todayStart)
      windowStart.setHours(randomHour, randomMinute, 0, 0)
      
      const windowEnd = new Date(windowStart)
      windowEnd.setHours(windowEnd.getHours() + 2) // 2 hour window

      const { data, error } = await this.supabase
        .from('user_daily_state')
        .insert({
          user_id: userId,
          date: today,
          prompt_id: promptId,
          window_start_ts: windowStart.toISOString(),
          window_end_ts: windowEnd.toISOString()
        })
        .select('*, prompts(*)')
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'Failed to create daily state' }
    }
  }

  // Entry operations
  async createEntry(entry: EntryInsert): Promise<{ data: Entry | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('entries')
        .insert(entry)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
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
      const friendIds = friends.map(friendship => 
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

  private async getTodaysPromptId(): Promise<number | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Look for a prompt generated today
      const { data } = await this.supabase
        .from('prompts')
        .select('id')
        .contains('tags', ['daily', 'generated'])
        .gte('created_at', today)
        .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return data?.id || null
    } catch (error) {
      return null
    }
  }

  private async generateTodaysPromptId(): Promise<number | null> {
    try {
      // Call the API to generate a new prompt
      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const result = await response.json()
      return result.prompt?.id || null
    } catch (error) {
      console.error('Failed to generate prompt:', error)
      return null
    }
  }
}

export const databaseService = new DatabaseService()


