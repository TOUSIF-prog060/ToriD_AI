
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}