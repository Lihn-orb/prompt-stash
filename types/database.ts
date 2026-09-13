import type { Prompt } from "@/types/prompt";

type PromptRow = { [Key in keyof Prompt]: Prompt[Key] };

export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: PromptRow;
        Insert: PromptRow;
        Update: Partial<Omit<Prompt, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
