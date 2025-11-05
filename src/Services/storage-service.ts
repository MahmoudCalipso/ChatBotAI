import { Injectable } from '@angular/core';
import {ChatSession} from '../Models/chat-session';
import {Message} from '../Models/message';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private PREFIX = 'StorageChatBotAI::';

  newId() {
    return crypto.randomUUID();
  }

  private bringBackSession(raw: any): ChatSession {
    return {
      ...raw,
      timestamp: new Date(raw.timestamp),
      messages: raw.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }))
    };
  }

  /** Load all sessions stored as separate JSON entries */
  loadAllSessions(): ChatSession[] {
    const sessions: ChatSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (key.startsWith(this.PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          sessions.push(this.bringBackSession(data));
        } catch { /* ignore corrupted entries */ }
      }
    }
    return sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /** Save or update one session */
  saveSession(session: ChatSession) {
    localStorage.setItem(`${this.PREFIX}${session.id}.json`, JSON.stringify(session));
  }

  /** Create a new empty session */
  createSession(): ChatSession {
    const session: ChatSession = {
      id: this.newId(),
      title: `Chat ${new Date().toLocaleString()}`,
      timestamp: new Date(),
      messages: []
    };
    this.saveSession(session);
    return session;
  }

  getSession(id: string): ChatSession | null {
    const data = localStorage.getItem(`${this.PREFIX}${id}.json`);
    return data ? this.bringBackSession(JSON.parse(data)) : null;
  }

  selectSession(id: string) {
    return this.getSession(id);
  }

  /** Add a new message and re-save session */
  appendMessage(sessionId: string, msg: Message) {
    const session = this.getSession(sessionId);
    if (!session) return;
    session.messages.push(msg);
    session.lastMessage = msg.text.slice(0, 60);
    session.timestamp = new Date();
    this.saveSession(session);
  }

  /** Delete one session */
  deleteSession(id: string) {
    localStorage.removeItem(`${this.PREFIX}${id}.json`);
  }

  /** “Download” a JSON file for a session */
  exportSession(id: string) {
    const session = this.getSession(id);
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `session_${id}.json`;
    link.click();
  }

  /** Save uploaded file (as Base64) inside “StorageChatBotAI virtual folder” */
  async saveFile(sessionId: string, filename: string, dataUrl: string, type: string) {
    const key = `${this.PREFIX}${sessionId}::${filename}`;
    const fileData = { name: filename, type, url: dataUrl };
    localStorage.setItem(key, JSON.stringify(fileData));
  }

  async getFile(sessionId: string, filename: string) {
    const key = `${this.PREFIX}${sessionId}::${filename}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}
