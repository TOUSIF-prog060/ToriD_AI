


export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  attachment?: { mimeType: string; hasData: boolean; }; // Changed to reflect data stored in memory, not localStorage
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}