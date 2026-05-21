export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      banks: {
        Row: {
          brand_color: string | null;
          created_at: string;
          icon_emoji: string | null;
          id: string;
          name: string;
          short_name: string;
        };
        Insert: {
          brand_color?: string | null;
          created_at?: string;
          icon_emoji?: string | null;
          id?: string;
          name: string;
          short_name: string;
        };
        Update: {
          brand_color?: string | null;
          created_at?: string;
          icon_emoji?: string | null;
          id?: string;
          name?: string;
          short_name?: string;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          closing_day: number;
          color: string;
          created_at: string;
          credit_limit_cents: number;
          due_day: number;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
          user_id: string;
          wallet_id: string;
        };
        Insert: {
          closing_day: number;
          color?: string;
          created_at?: string;
          credit_limit_cents?: number;
          due_day: number;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
          wallet_id: string;
        };
        Update: {
          closing_day?: number;
          color?: string;
          created_at?: string;
          credit_limit_cents?: number;
          due_day?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
          wallet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cards_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          icon_name: string | null;
          id: string;
          is_active: boolean;
          name: string;
          user_id: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          user_id?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          color: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          card_id: string;
          closing_date: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          reference_month: number;
          reference_year: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          card_id: string;
          closing_date?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          reference_month: number;
          reference_year: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          card_id?: string;
          closing_date?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          reference_month?: number;
          reference_year?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transaction_splits: {
        Row: {
          amount_cents: number;
          contact_id: string;
          created_at: string;
          id: string;
          is_custom: boolean;
          settled_at: string | null;
          transaction_id: string;
          user_id: string;
        };
        Insert: {
          amount_cents: number;
          contact_id: string;
          created_at?: string;
          id?: string;
          is_custom?: boolean;
          settled_at?: string | null;
          transaction_id: string;
          user_id: string;
        };
        Update: {
          amount_cents?: number;
          contact_id?: string;
          created_at?: string;
          id?: string;
          is_custom?: boolean;
          settled_at?: string | null;
          transaction_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_splits_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount_cents: number;
          card_id: string | null;
          category_id: string | null;
          created_at: string;
          description: string;
          id: string;
          installment_number: number;
          installment_total: number;
          invoice_id: string | null;
          occurred_at: string;
          operation: Database["public"]["Enums"]["operation_type"] | null;
          split_mode: Database["public"]["Enums"]["split_mode"];
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
          user_id: string;
          user_included_in_split: boolean;
          user_share_cents: number;
          wallet_id: string | null;
        };
        Insert: {
          amount_cents: number;
          card_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          installment_number?: number;
          installment_total?: number;
          invoice_id?: string | null;
          occurred_at?: string;
          operation?: Database["public"]["Enums"]["operation_type"] | null;
          split_mode?: Database["public"]["Enums"]["split_mode"];
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id: string;
          user_included_in_split?: boolean;
          user_share_cents?: number;
          wallet_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          card_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          installment_number?: number;
          installment_total?: number;
          invoice_id?: string | null;
          occurred_at?: string;
          operation?: Database["public"]["Enums"]["operation_type"] | null;
          split_mode?: Database["public"]["Enums"]["split_mode"];
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id?: string;
          user_included_in_split?: boolean;
          user_share_cents?: number;
          wallet_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
        ];
      };
      user_category_overrides: {
        Row: {
          category_id: string;
          created_at: string;
          is_active: boolean;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          is_active?: boolean;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          is_active?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_category_overrides_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      wallets: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"];
          balance_cents: number;
          bank_id: string | null;
          created_at: string;
          id: string;
          invested_cents: number;
          is_active: boolean;
          is_default: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"];
          balance_cents?: number;
          bank_id?: string | null;
          created_at?: string;
          id?: string;
          invested_cents?: number;
          is_active?: boolean;
          is_default?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"];
          balance_cents?: number;
          bank_id?: string | null;
          created_at?: string;
          id?: string;
          invested_cents?: number;
          is_active?: boolean;
          is_default?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallets_bank_id_fkey";
            columns: ["bank_id"];
            isOneToOne: false;
            referencedRelation: "banks";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_type: "PF" | "PJ";
      operation_type: "card" | "loan" | "pix";
      split_mode: "none" | "equal" | "custom";
      transaction_type: "income" | "expense";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["PF", "PJ"],
      operation_type: ["card", "loan", "pix"],
      split_mode: ["none", "equal", "custom"],
      transaction_type: ["income", "expense"],
    },
  },
} as const;
