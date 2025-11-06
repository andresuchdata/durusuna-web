export type Conversation = {
  id: string;
  type: "direct" | "group";
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  other_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  participants?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    name?: string;
    avatar_url?: string;
    user_type?: string;
  }>;
  last_message?: {
    id: string;
    text?: string;
    content?: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count?: number;
  updated_at?: string;
  created_at?: string;
};

export type Message = {
  id: string;
  serverId?: string;
  conversation_id?: string;
  conversationId?: string;
  sender_id?: string;
  senderId?: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  text?: string;
  content?: string;
  attachments?: Array<{ id: string; url: string; type: string }>;
  created_at?: string;
  createdAt?: string;
  status?: "sent" | "delivered" | "read";
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
};
