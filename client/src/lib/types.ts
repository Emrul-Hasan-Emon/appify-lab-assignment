export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export type PostVisibility = "public" | "private";

export interface PostMedia {
  id: number;
  mediaUrl: string;
  mediaType: "image" | "video";
}

export interface PostAuthor {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Post {
  id: number;
  text?: string;
  visibility: PostVisibility;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: PostAuthor;
  media: PostMedia[];
}

export interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  isEdited: boolean;
  likesCount: number;
  repliesCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: PostAuthor;
}
