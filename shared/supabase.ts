export type UserRole =
  | "admin"
  | "employee"
  | "franchise_manager"
  | "factory_manager";

export interface RoleCapability {
  role: UserRole;
  label: string;
  description: string;
  canManageOrders: boolean;
  canManageCustomers: boolean;
  canManageInventory: boolean;
  canViewAnalytics: boolean;
  canManageLogistics: boolean;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      role_capabilities: {
        Row: RoleCapability & {
          updated_at: string;
        };
      };
    };
  };
}

