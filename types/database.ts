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
          sold_price: number | null
          sold_at: string | null
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
          sold_price?: number | null
          sold_at?: string | null
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
          sold_price?: number | null
          sold_at?: string | null
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
      client_shares: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          token: string
          title: string | null
          message: string | null
          listing_ids: string[]
          views: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          token?: string
          title?: string | null
          message?: string | null
          listing_ids: string[]
          views?: number
          created_at?: string
        }
        Update: {
          views?: number
          title?: string | null
          message?: string | null
        }
        Relationships: []
      }
      client_share_responses: {
        Row: {
          id: string
          share_id: string
          listing_id: string
          reaction: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          share_id: string
          listing_id: string
          reaction: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          reaction?: string
          comment?: string | null
        }
        Relationships: []
      }
      listing_photos: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          url: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          url: string
          position?: number
          created_at?: string
        }
        Update: {
          position?: number
          url?: string
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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          company_name: string | null
          phone: string | null
          avatar_url: string | null
          website: string | null
          bio: string | null
          goal_monthly_margin: number
          goal_annual_revenue: number
          goal_margin_per_vehicle: number
          onboarding_completed: boolean
          onboarding_progress: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          goal_monthly_margin?: number
          goal_annual_revenue?: number
          goal_margin_per_vehicle?: number
          onboarding_completed?: boolean
          onboarding_progress?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          goal_monthly_margin?: number
          goal_annual_revenue?: number
          goal_margin_per_vehicle?: number
          onboarding_completed?: boolean
          onboarding_progress?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          listing_id: string | null
          brand: string | null
          model: string | null
          year: number | null
          buy_price: number | null
          sell_price: number | null
          total_cost: number | null
          margin: number | null
          margin_pct: number | null
          sold_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id?: string | null
          brand?: string | null
          model?: string | null
          year?: number | null
          buy_price?: number | null
          sell_price?: number | null
          total_cost?: number | null
          margin?: number | null
          margin_pct?: number | null
          sold_at?: string
          created_at?: string
        }
        Update: {
          brand?: string | null
          model?: string | null
          year?: number | null
          buy_price?: number | null
          sell_price?: number | null
          total_cost?: number | null
          margin?: number | null
          margin_pct?: number | null
          sold_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          type: string
          period: string
          target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          period: string
          target: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          period?: string
          target?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          user_id: string | null
          title: string
          slug: string
          content: string
          excerpt: string | null
          category: string | null
          cover_image: string | null
          sources: Json | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          slug: string
          content: string
          excerpt?: string | null
          category?: string | null
          cover_image?: string | null
          sources?: Json | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string | null
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          category?: string | null
          cover_image?: string | null
          sources?: Json | null
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      market_trends: {
        Row: {
          id: string
          user_id: string
          trends_data: Json
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trends_data: Json
          updated_at?: string
          created_at?: string
        }
        Update: {
          trends_data?: Json
          updated_at?: string
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
      prestations: {
        Row: {
          id: string
          nom: string
          categorie: 'cils' | 'sourcils' | 'sourire'
          description: string | null
          duree_minutes: number
          prix: number
          actif: boolean
          ordre: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          categorie: 'cils' | 'sourcils' | 'sourire'
          description?: string | null
          duree_minutes?: number
          prix: number
          actif?: boolean
          ordre?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom?: string
          categorie?: 'cils' | 'sourcils' | 'sourire'
          description?: string | null
          duree_minutes?: number
          prix?: number
          actif?: boolean
          ordre?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          client_id: string
          prestation_id: string
          date_rdv: string
          heure_rdv: string
          lieu: 'chez_naea' | 'domicile'
          statut: 'en_attente' | 'confirmee' | 'realisee' | 'annulee' | 'no_show'
          montant_total: number
          montant_acompte: number
          acompte_paye: boolean
          stripe_payment_id: string | null
          stripe_checkout_session_id: string | null
          notes_client: string | null
          notes_admin: string | null
          google_event_id: string | null
          rappel_envoye: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          prestation_id: string
          date_rdv: string
          heure_rdv: string
          lieu: 'chez_naea' | 'domicile'
          statut?: 'en_attente' | 'confirmee' | 'realisee' | 'annulee' | 'no_show'
          montant_total: number
          montant_acompte: number
          acompte_paye?: boolean
          stripe_payment_id?: string | null
          stripe_checkout_session_id?: string | null
          notes_client?: string | null
          notes_admin?: string | null
          google_event_id?: string | null
          rappel_envoye?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          prestation_id?: string
          date_rdv?: string
          heure_rdv?: string
          lieu?: 'chez_naea' | 'domicile'
          statut?: 'en_attente' | 'confirmee' | 'realisee' | 'annulee' | 'no_show'
          montant_total?: number
          montant_acompte?: number
          acompte_paye?: boolean
          stripe_payment_id?: string | null
          stripe_checkout_session_id?: string | null
          notes_client?: string | null
          notes_admin?: string | null
          google_event_id?: string | null
          rappel_envoye?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reservations_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_prestation_id_fkey'
            columns: ['prestation_id']
            isOneToOne: false
            referencedRelation: 'prestations'
            referencedColumns: ['id']
          }
        ]
      }
      disponibilites: {
        Row: {
          id: string
          jour_semaine: number
          heure_debut: string
          heure_fin: string
          actif: boolean
          created_at: string
        }
        Insert: {
          id?: string
          jour_semaine: number
          heure_debut: string
          heure_fin: string
          actif?: boolean
          created_at?: string
        }
        Update: {
          jour_semaine?: number
          heure_debut?: string
          heure_fin?: string
          actif?: boolean
        }
        Relationships: []
      }
      indisponibilites: {
        Row: {
          id: string
          date_debut: string
          date_fin: string
          motif: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date_debut: string
          date_fin: string
          motif?: string | null
          created_at?: string
        }
        Update: {
          date_debut?: string
          date_fin?: string
          motif?: string | null
        }
        Relationships: []
      }
      temoignages: {
        Row: {
          id: string
          client_id: string | null
          prenom_affiche: string
          prestation_nom: string
          contenu: string
          note: number
          affiche: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          prenom_affiche: string
          prestation_nom: string
          contenu: string
          note: number
          affiche?: boolean
          created_at?: string
        }
        Update: {
          client_id?: string | null
          prenom_affiche?: string
          prestation_nom?: string
          contenu?: string
          note?: number
          affiche?: boolean
        }
        Relationships: []
      }
      parametres: {
        Row: {
          cle: string
          valeur: string
          description: string | null
          updated_at: string
        }
        Insert: {
          cle: string
          valeur: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          valeur?: string
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      statut_reservation: 'en_attente' | 'confirmee' | 'realisee' | 'annulee' | 'no_show'
    }
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

export type ClientShare = Database['public']['Tables']['client_shares']['Row']
export type ClientShareResponse = Database['public']['Tables']['client_share_responses']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ListingStatus = 'new' | 'viewed' | 'contacted' | 'negotiation' | 'bought' | 'resold' | 'ignored'
export type ListingPhoto = Database['public']['Tables']['listing_photos']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']

export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type MarketTrend = Database['public']['Tables']['market_trends']['Row']

// Naea Beauty types
export type Prestation = Database['public']['Tables']['prestations']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update']
export type Disponibilite = Database['public']['Tables']['disponibilites']['Row']
export type Indisponibilite = Database['public']['Tables']['indisponibilites']['Row']
export type Temoignage = Database['public']['Tables']['temoignages']['Row']
export type Parametre = Database['public']['Tables']['parametres']['Row']
export type StatutReservation = Database['public']['Enums']['statut_reservation']

export type ReservationWithDetails = Reservation & {
  prestations?: Prestation | null
  clients?: { id: string; prenom: string; nom: string; email: string; telephone: string } | null
}

export type ListingWithDetails = Listing & {
  client?: Client | null
  clients?: Client | null
  margin?: ListingMargin | null
  listing_margins?: ListingMargin[] | null
  checklist?: ListingChecklist | null
  listing_checklist?: ListingChecklist[] | null
  listing_photos?: ListingPhoto[] | null
}
