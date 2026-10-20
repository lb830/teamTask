export type AccountRole = "member" | "admin" | "superuser";
export type TodoStatus = "todo" | "in_progress" | "done";
export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: AccountRole;
  suspended: boolean;
  created_at: string;
};
export type Team = {
  id: string;
  name: string;
  slug: string;
  created_by: string | null;
  created_at: string;
};
export type Membership = {
  team_id: string;
  user_id: string;
  joined_at: string;
};
export type Invitation = {
  id: string;
  email: string;
  kind: "team" | "admin";
  team_id: string | null;
  token_hash: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  revoked_at: string | null;
  delivery_status: "pending" | "sent" | "failed";
};
export type WikiPage = {
  id: string;
  team_id: string;
  slug: string;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type PersonalTodo = {
  id: string;
  created_by: string;
  title: string;
  status: TodoStatus;
  due_date: string | null;
  created_at: string;
};
export type TeamTodo = Omit<PersonalTodo, "created_by"> & {
  team_id: string;
  created_by: string | null;
};
export type VaultProject = {
  id: string;
  team_id: string;
  name: string;
  created_by: string | null;
  created_at: string;
};
export type VaultFile = {
  id: string;
  team_id: string;
  project_id: string | null;
  name: string;
  storage_path: string;
  size: number;
  content_type: string;
  ready: boolean;
  created_by: string | null;
  created_at: string;
};
export type WallPost = {
  id: string;
  team_id: string;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type Reaction = {
  post_id: string;
  team_id: string;
  user_id: string;
  emoji: string;
};
type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id" | "email">;
      bootstrap_state: Table<
        { singleton: boolean; user_id: string; created_at: string },
        "user_id"
      >;
      teams: Table<Team, "name" | "slug">;
      team_members: Table<Membership, "team_id" | "user_id">;
      invitations: Table<Invitation, "email" | "kind" | "token_hash">;
      wiki_pages: Table<WikiPage, "team_id" | "title" | "slug">;
      personal_todos: Table<PersonalTodo, "title">;
      team_todos: Table<TeamTodo, "team_id" | "title">;
      vault_projects: Table<VaultProject, "team_id" | "name">;
      vault_files: Table<
        VaultFile,
        "id" | "team_id" | "name" | "storage_path" | "size"
      >;
      wall_posts: Table<WallPost, "team_id" | "title" | "body">;
      wall_reactions: Table<Reaction, "post_id" | "team_id" | "emoji">;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_active: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_superuser: { Args: Record<string, never>; Returns: boolean };
      is_member: { Args: { target_team: string }; Returns: boolean };
      create_team: {
        Args: { team_name: string; team_slug: string };
        Returns: string;
      };
      set_account_role: {
        Args: { target_user: string; new_role: AccountRole };
        Returns: undefined;
      };
      set_account_suspended: {
        Args: { target_user: string; is_suspended: boolean };
        Returns: undefined;
      };
      bootstrap_superuser: {
        Args: { target_user: string };
        Returns: undefined;
      };
      accept_invitation: {
        Args: { invite_hash: string };
        Returns: string | null;
      };
      reaction_counts: {
        Args: { target_team: string; post_ids: string[] };
        Returns: {
          post_id: string;
          emoji: string;
          total: number;
          reacted: boolean;
        }[];
      };
      finalize_upload: { Args: { file_id: string }; Returns: undefined };
    };
    Enums: { account_role: AccountRole; todo_status: TodoStatus };
    CompositeTypes: { [_ in never]: never };
  };
};
