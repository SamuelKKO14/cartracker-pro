export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          email: string | null
          budget: number | null
          criteria: string | null
          notes: string | null
          billing_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone?: string | null
          email?: string | null
          budget?: number | null
          criteria?: string | null
          notes?: string | null
          billing_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          budget?: number | null
          criteria?: string | null
          notes?: string | null
          billing_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          id: string
          user_id: string
          client_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          text: string
          created_at?: string
        }
        Update: {
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: string
            columns: string[]
            isOneToOne: boolean
            referencedRelation: string
            referencedColumns: string[]
          }
        ]
      }
      listings: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          brand: string
          model: string | null
          generation: string | null
          year: number | null
          km: number | null
          price: number | null
          fuel: string | null
          gearbox: string | null
          body: string | null
          country: string | null
          seller: string | null
          first_owner: boolean
          url: string | null
          source: string | null
          notes: string | null
          status: string
          tags: string[] | null
          auto_score: number | null
          manual_score: number | null
          horsepower: number | null
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          brand: string
          model?: string | null
          generation?: string | null
          year?: number | null
          km?: number | null
          price?: number | null
          fuel?: string | null
          gearbox?: string | null
          body?: string | null
          country?: string | null
          seller?: string | null
          first_owner?: boolean
          url?: string | null
          source?: string | null
          notes?: string | null
          status?: string
          tags?: string[] | null
          auto_score?: number | null
          manual_score?: number | null
          horsepower?: number | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          brand?: string
          model?: string | null
          generation?: string | null
          year?: number | null
          km?: number | null
          price?: number | null
          fuel?: string | null
          gearbox?: string | null
          body?: string | null
          country?: string | null
          seller?: string | null
          first_owner?: boolean
          url?: string | null
          source?: string | null
          notes?: string | null
          status?: string
          tags?: string[] | null
          auto_score?: number | null
          manual_score?: number | null
          horsepower?: number | null
          color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      listing_margins: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          buy_price: number | null
          transport: number
          repair: number
          ct_cost: number
          registration: number
          other_costs: number
          sell_price: number | null
          total_cost: number | null
          margin: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          buy_price?: number | null
          transport?: number
          repair?: number
          ct_cost?: number
          registration?: number
          other_costs?: number
          sell_price?: number | null
          total_cost?: number | null
          margin?: number | null
          created_at?: string
        }
        Update: {
          buy_price?: number | null
          transport?: number
          repair?: number
          ct_cost?: number
          registration?: number
          other_costs?: number
          sell_price?: number | null
          total_cost?: number | null
          margin?: number | null
        }
        Relationships: []
      }
      listing_checklist: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          ct_ok: boolean
          carnet_ok: boolean
          histovec_ok: boolean
          owners_ok: boolean
          no_sinistres: boolean
          test_drive: boolean
          mecanique_ok: boolean
          carrosserie_ok: boolean
          pneus_ok: boolean
          papiers_ok: boolean
          no_gage: boolean
          price_negotiated: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          ct_ok?: boolean
          carnet_ok?: boolean
          histovec_ok?: boolean
          owners_ok?: boolean
          no_sinistres?: boolean
          test_drive?: boolean
          mecanique_ok?: boolean
          carrosserie_ok?: boolean
          pneus_ok?: boolean
          papiers_ok?: boolean
          no_gage?: boolean
          price_negotiated?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          ct_ok?: boolean
          carnet_ok?: boolean
          histovec_ok?: boolean
          owners_ok?: boolean
          no_sinistres?: boolean
          test_drive?: boolean
          mecanique_ok?: boolean
          carrosserie_ok?: boolean
          pneus_ok?: boolean
          papiers_ok?: boolean
          no_gage?: boolean
          price_negotiated?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          query: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          created_at?: string
        }
        Update: {
          query?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          id: string
          listing_id: string
          price: number | null
          recorded_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          price?: number | null
          recorded_at?: string
        }
        Update: {
          price?: number | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Helper types
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientNote = Database['public']['Tables']['client_notes']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type ListingInsert = Database['public']['Tables']['listings']['Insert']
export type ListingMargin = Database['public']['Tables']['listing_margins']['Row']
export type ListingChecklist = Database['public']['Tables']['listing_checklist']['Row']
export type SavedSearch = Database['public']['Tables']['saved_searches']['Row']

export type ListingStatus = 'new' | 'viewed' | 'contacted' | 'negotiation' | 'bought' | 'resold' | 'ignored'

export type ListingWithDetails = Listing & {
  client?: Client | null
  clients?: Client | null
  margin?: ListingMargin | null
  listing_margins?: ListingMargin[] | null
  checklist?: ListingChecklist | null
  listing_checklist?: ListingChecklist[] | null
}
