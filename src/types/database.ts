// Stub matching supabase/migrations/00001_initial_schema.sql
// Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          stripe_customer_id: string | null
          has_payment_method: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          avatar_url?: string | null
          stripe_customer_id?: string | null
          has_payment_method?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          stripe_customer_id?: string | null
          has_payment_method?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      auctions: {
        Row: {
          id: string
          slug: string
          celebrity_name: string
          celebrity_title: string
          description: string
          charity_name: string
          charity_website: string | null
          image_url: string
          starting_price: number
          min_increment: number
          current_max_bid: number
          bid_count: number
          end_time: string
          original_end_time: string
          status: 'active' | 'closed'
          winner_id: string | null
          winning_bid_id: string | null
          featured: boolean
          payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          celebrity_name: string
          celebrity_title: string
          description: string
          charity_name: string
          charity_website?: string | null
          image_url: string
          starting_price?: number
          min_increment?: number
          current_max_bid?: number
          bid_count?: number
          end_time: string
          original_end_time: string
          status?: 'active' | 'closed'
          winner_id?: string | null
          winning_bid_id?: string | null
          featured?: boolean
          payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          celebrity_name?: string
          celebrity_title?: string
          description?: string
          charity_name?: string
          charity_website?: string | null
          image_url?: string
          starting_price?: number
          min_increment?: number
          current_max_bid?: number
          bid_count?: number
          end_time?: string
          original_end_time?: string
          status?: 'active' | 'closed'
          winner_id?: string | null
          winning_bid_id?: string | null
          featured?: boolean
          payment_intent_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'auctions_winner_id_fkey'
            columns: ['winner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'auctions_winning_bid_id_fkey'
            columns: ['winning_bid_id']
            isOneToOne: false
            referencedRelation: 'bids'
            referencedColumns: ['id']
          }
        ]
      }
      bids: {
        Row: {
          id: string
          auction_id: string
          user_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          auction_id: string
          user_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          auction_id?: string
          user_id?: string
          amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bids_auction_id_fkey'
            columns: ['auction_id']
            isOneToOne: false
            referencedRelation: 'auctions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bids_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      place_bid: {
        Args: { p_auction_id: string; p_amount: number }
        Returns: Json
      }
    }
    Enums: {
      auction_status: 'active' | 'closed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Auction = Tables<'auctions'>
export type Bid = Tables<'bids'>
export type User = Tables<'users'>

export type BidWithUser = Bid & {
  users: Pick<User, 'id' | 'name' | 'avatar_url'>
}
