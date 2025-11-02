export interface Comment {
    id: string;
    userId: string;
    username: string;
    text: string;
    timestamp: Date;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  timestamp: Date;
  imageUrl?: string;
  comments?: Comment[];
  likes?: number;
  shares?: number;
}

export interface Profile {
  username: string;
  avatarUrl: string;
  followers?: string[];
  following?: string[];
}

export interface EditableProfileData {
  username: string;
}

// FIX: Add Notification interface
export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  actorUsername: string;
  actorAvatarUrl: string;
  postContentSample?: string;
  timestamp: Date;
  read: boolean;
}
