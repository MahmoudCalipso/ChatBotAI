import {Message} from './message';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  messages: Message[];
}
