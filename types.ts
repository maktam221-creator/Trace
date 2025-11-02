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