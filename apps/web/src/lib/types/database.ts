export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          tz: string | null
          onesignal_player_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          tz?: string | null
          onesignal_player_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          tz?: string | null
          onesignal_player_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: number
          text: string
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: number
          text: string
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: number
          text?: string
          tags?: string[]
          created_at?: string
        }
      }
      user_daily_state: {
        Row: {
          user_id: string
          date: string
          prompt_id: number
          window_start_ts: string
          window_end_ts: string
          notified_at_ts: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          date: string
          prompt_id: number
          window_start_ts: string
          window_end_ts: string
          notified_at_ts?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          date?: string
          prompt_id?: number
          window_start_ts?: string
          window_end_ts?: string
          notified_at_ts?: string | null
          created_at?: string
        }
      }
      entries: {
        Row: {
          id: string
          user_id: string
          date: string
          prompt_id: number
          text: string
          photo_url: string | null
          on_time: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          prompt_id: number
          text: string
          photo_url?: string | null
          on_time?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          prompt_id?: number
          text?: string
          photo_url?: string | null
          on_time?: boolean
          created_at?: string
        }
      }
      streaks: {
        Row: {
          user_id: string
          current_count: number
          longest_count: number
          updated_at: string
        }
        Insert: {
          user_id: string
          current_count?: number
          longest_count?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          current_count?: number
          longest_count?: number
          updated_at?: string
        }
      }
      friends: {
        Row: {
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
        }
        Insert: {
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
        Update: {
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          entry_id: string
          reactor_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          reactor_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          reactor_id?: string
          emoji?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
