export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applicant_id: string
          cohort_id: string | null
          created_at: string
          evaluation_notes: string | null
          evaluator_id: string | null
          id: string
          motivation: string | null
          program_id: string | null
          reviewed_at: string | null
          score: number | null
          startup_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cohort_id?: string | null
          created_at?: string
          evaluation_notes?: string | null
          evaluator_id?: string | null
          id?: string
          motivation?: string | null
          program_id?: string | null
          reviewed_at?: string | null
          score?: number | null
          startup_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cohort_id?: string | null
          created_at?: string
          evaluation_notes?: string | null
          evaluator_id?: string | null
          id?: string
          motivation?: string | null
          program_id?: string | null
          reviewed_at?: string | null
          score?: number | null
          startup_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount_planned: number | null
          amount_spent: number | null
          category: string
          created_at: string
          currency: string | null
          grant_id: string | null
          id: string
          label: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          amount_planned?: number | null
          amount_spent?: number | null
          category: string
          created_at?: string
          currency?: string | null
          grant_id?: string | null
          id?: string
          label: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_planned?: number | null
          amount_spent?: number | null
          category?: string
          created_at?: string
          currency?: string | null
          grant_id?: string | null
          id?: string
          label?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          feedback: string | null
          id: string
          meeting_url: string | null
          mentor_id: string
          notes: string | null
          rating: number | null
          scheduled_at: string
          startup_id: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          meeting_url?: string | null
          mentor_id: string
          notes?: string | null
          rating?: number | null
          scheduled_at: string
          startup_id: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          meeting_url?: string | null
          mentor_id?: string
          notes?: string | null
          rating?: number | null
          scheduled_at?: string
          startup_id?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          max_startups: number | null
          name: string
          program_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_startups?: number | null
          name: string
          program_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_startups?: number | null
          name?: string
          program_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_group: boolean | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean | null
          title?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          level: string | null
          modules_count: number | null
          program_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          level?: string | null
          modules_count?: number | null
          program_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          level?: string | null
          modules_count?: number | null
          program_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_online: boolean | null
          location: string | null
          max_attendees: number | null
          meeting_url: string | null
          organizer_id: string | null
          program_id: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          organizer_id?: string | null
          program_id?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          organizer_id?: string | null
          program_id?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          amount_disbursed: number | null
          amount_total: number
          code: string
          created_at: string
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          organization: string | null
          program_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["grant_status"]
          updated_at: string
        }
        Insert: {
          amount_disbursed?: number | null
          amount_total?: number
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          organization?: string | null
          program_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["grant_status"]
          updated_at?: string
        }
        Update: {
          amount_disbursed?: number | null
          amount_total?: number
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          organization?: string | null
          program_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["grant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_matches: {
        Row: {
          id: string
          match_score: number | null
          matched_at: string
          mentor_id: string
          startup_id: string
          status: string | null
        }
        Insert: {
          id?: string
          match_score?: number | null
          matched_at?: string
          mentor_id: string
          startup_id: string
          status?: string | null
        }
        Update: {
          id?: string
          match_score?: number | null
          matched_at?: string
          mentor_id?: string
          startup_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          availability: string | null
          average_rating: number | null
          bio: string | null
          created_at: string
          expertise_areas: string[] | null
          hourly_rate: number | null
          id: string
          linkedin_url: string | null
          max_startups: number | null
          total_sessions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          linkedin_url?: string | null
          max_startups?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          linkedin_url?: string | null
          max_startups?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          objectives: string | null
          owner_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          objectives?: string | null
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          objectives?: string | null
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          organization: string | null
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          organization?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          organization?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          budget_total: number | null
          code: string
          created_at: string
          currency: string | null
          description: string | null
          end_date: string | null
          funder: string | null
          id: string
          name: string
          portfolio_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget_total?: number | null
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          funder?: string | null
          id?: string
          name: string
          portfolio_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget_total?: number | null
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          funder?: string | null
          id?: string
          name?: string
          portfolio_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          code: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          owner_id: string | null
          program_id: string | null
          progress: number | null
          start_date: string | null
          startup_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          code?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          program_id?: string | null
          progress?: number | null
          start_date?: string | null
          startup_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          code?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          program_id?: string | null
          progress?: number | null
          start_date?: string | null
          startup_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          program_id: string | null
          title: string
          type: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          program_id?: string | null
          title: string
          type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          program_id?: string | null
          title?: string
          type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: Database["public"]["Enums"]["risk_level"]
          mitigation: string | null
          owner_id: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["risk_level"]
          mitigation?: string | null
          owner_id?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["risk_level"]
          mitigation?: string | null
          owner_id?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_members: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          role: string | null
          startup_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          role?: string | null
          startup_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          role?: string | null
          startup_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_members_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          city: string | null
          cohort_id: string | null
          country: string | null
          created_at: string
          description: string | null
          founded_date: string | null
          founder_id: string | null
          id: string
          logo_url: string | null
          name: string
          pitch_deck_url: string | null
          revenue_monthly: number | null
          score: number | null
          sector: string | null
          stage: string | null
          team_size: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          cohort_id?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          founder_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pitch_deck_url?: string | null
          revenue_monthly?: number | null
          score?: number | null
          sector?: string | null
          stage?: string | null
          team_size?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          cohort_id?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          founder_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pitch_deck_url?: string | null
          revenue_monthly?: number | null
          score?: number | null
          sector?: string | null
          stage?: string | null
          team_size?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_coordinator: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "coordinator"
        | "mentor"
        | "entrepreneur"
        | "evaluator"
        | "investor"
        | "funder"
      application_status:
        | "submitted"
        | "screening"
        | "interview"
        | "due_diligence"
        | "accepted"
        | "rejected"
      event_type:
        | "demo_day"
        | "workshop"
        | "networking"
        | "hackathon"
        | "committee"
        | "webinar"
        | "other"
      grant_status: "draft" | "active" | "disbursing" | "closing" | "closed"
      project_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      risk_level: "low" | "medium" | "high" | "critical"
      session_status:
        | "planned"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "todo" | "in_progress" | "in_review" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "coordinator",
        "mentor",
        "entrepreneur",
        "evaluator",
        "investor",
        "funder",
      ],
      application_status: [
        "submitted",
        "screening",
        "interview",
        "due_diligence",
        "accepted",
        "rejected",
      ],
      event_type: [
        "demo_day",
        "workshop",
        "networking",
        "hackathon",
        "committee",
        "webinar",
        "other",
      ],
      grant_status: ["draft", "active", "disbursing", "closing", "closed"],
      project_status: ["draft", "active", "paused", "completed", "cancelled"],
      risk_level: ["low", "medium", "high", "critical"],
      session_status: [
        "planned",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["todo", "in_progress", "in_review", "done"],
    },
  },
} as const
