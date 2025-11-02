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
  gender?: string;
  qualification?: string;
  country?: string;
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
  gender: string;
  qualification: string;
  country: string;
  followers?: string[];
  following?: string[];
}

export interface EditableProfileData {
  username: string;
  gender: string;
  qualification: string;
  country: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  actorUsername: string;
  actorAvatarUrl: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  postContentSample?: string;
  read: boolean;
  timestamp: Date;
}
