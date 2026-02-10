
export interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  city?: string;
  country: string;
  interest: string;
  interests?: string[];
  religion: string;
  imageUrl: string;
  bio?: string;
  gender?: string;
  seeking?: string;
  goal?: string;
  isComplete?: boolean;
  settings?: {
    isPublic?: boolean;
    incognitoMode?: boolean;
    notifications?: boolean;
  };
}

export interface FileData {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  text?: string;
  file?: FileData;
  senderId: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  participant: Profile;
  messages: Message[];
}

export type AppTab = 'discover' | 'matches' | 'messages' | 'notifs' | 'profile' | 'likes' | 'security' | 'blocked' | 'change-password' | 'edit-profile' | 'settings' | 'payments';

export interface FilterSettings {
  minAge: number;
  maxAge: number;
  country: string;
  religion: string;
}
