import { getToken } from "./session";
import { AuthUser, Comment, Post } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data &&
        (Array.isArray(data.message) ? data.message[0] : data.message)) ||
      "Something went wrong";
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function register(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface FeedPage {
  items: Post[];
  nextCursor: number | null;
}

export function fetchFeed(cursor?: number | null) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", String(cursor));
  const qs = params.toString();
  return request<FeedPage>(`/posts${qs ? `?${qs}` : ""}`);
}

export function createPost(payload: {
  text: string;
  visibility: "public" | "private";
  files: File[];
}) {
  const form = new FormData();
  if (payload.text) form.set("text", payload.text);
  form.set("visibility", payload.visibility);
  payload.files.forEach((file) => form.append("media", file));

  return request<Post>("/posts", {
    method: "POST",
    body: form,
  });
}

export function deletePost(postId: number) {
  return request<void>(`/posts/${postId}`, { method: "DELETE" });
}

export function likePost(postId: number) {
  return request<{ liked: boolean }>(`/posts/${postId}/like`, {
    method: "POST",
  });
}

export function unlikePost(postId: number) {
  return request<{ liked: boolean }>(`/posts/${postId}/like`, {
    method: "DELETE",
  });
}

export function fetchPostLikes(postId: number) {
  return request<AuthUser[]>(`/posts/${postId}/likes`);
}

export function fetchComments(postId: number) {
  return request<Comment[]>(`/posts/${postId}/comments`);
}

export function createComment(
  postId: number,
  payload: { content: string; parentId?: number },
) {
  return request<Comment>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateComment(commentId: number, content: string) {
  return request<Comment>(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export function deleteComment(commentId: number) {
  return request<void>(`/comments/${commentId}`, { method: "DELETE" });
}

export function likeComment(commentId: number) {
  return request<{ liked: boolean }>(`/comments/${commentId}/like`, {
    method: "POST",
  });
}

export function unlikeComment(commentId: number) {
  return request<{ liked: boolean }>(`/comments/${commentId}/like`, {
    method: "DELETE",
  });
}

export function fetchCommentLikes(commentId: number) {
  return request<AuthUser[]>(`/comments/${commentId}/likes`);
}
