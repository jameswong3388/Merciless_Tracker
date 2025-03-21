export interface User {
  id: string;
  name: string;
  username: string;
  profileImage?: string;
}

export interface Tweet {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  likes: number;
  retweets: number;
  views: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  likes: number;
  replies: Comment[];
} 