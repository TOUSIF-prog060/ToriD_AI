

export interface N8nWorkflow {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  chat_id: string; // Foreign key to Chat
  user_id: string; // Foreign key to auth.users
  text_content: string; // Renamed from 'text' to avoid SQL keyword conflicts
  sender: 'user' | 'ai';
  created_at: string; // ISO timestamp string from Supabase
  attachment_mime_type?: string; // Stored in DB
  attachment_file_name?: string; // Stored in DB
  is_workflow_suggestion?: boolean; // Flag for special rendering
}

export interface Chat {
  id: string;
  user_id: string; // Foreign key to auth.users
  title: string;
  created_at: string; // ISO timestamp string from Supabase
}

// Type for chat messages with temporary attachment data
export interface MessageWithAttachmentData extends Message {
  attachment_base64?: string; // This is only for client-side display, not persisted in DB
  workflows?: N8nWorkflow[]; // For client-side rendering of workflow cards
}
