export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  fileAttachment?: {
    name: string;
    type: string;
    url: string;
  };
}
