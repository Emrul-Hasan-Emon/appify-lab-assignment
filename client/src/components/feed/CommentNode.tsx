"use client";

import { useState } from "react";
import { fetchCommentLikes } from "@/lib/api";
import { Comment } from "@/lib/types";
import LikesPopover from "./LikesPopover";

export default function CommentNode({
  comment,
  allComments,
  currentUserId,
  onReply,
  onLikeToggle,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  allComments: Comment[];
  currentUserId: number;
  onReply: (parentId: number, content: string) => Promise<void>;
  onLikeToggle: (comment: Comment) => Promise<void>;
  onEdit: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const children = allComments.filter((c) => c.parentId === comment.id);
  const isOwn = comment.author.id === currentUserId;

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReply(comment.id, replyText.trim());
    setReplyText("");
    setReplying(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editText.trim()) return;
    await onEdit(comment.id, editText.trim());
    setEditing(false);
  }

  return (
    <div style={{ marginTop: 10, marginLeft: comment.parentId ? 24 : 0 }}>
      <div style={{ background: "#f5f6f8", borderRadius: 8, padding: "8px 12px" }}>
        <strong>
          {comment.author.firstName} {comment.author.lastName}
        </strong>
        {comment.isEdited && (
          <span style={{ color: "#999", fontSize: 12 }}> (edited)</span>
        )}
        {editing ? (
          <form onSubmit={submitEdit} style={{ marginTop: 4 }}>
            <input
              className="form-control"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary mt-1 me-1">
              Save
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary mt-1"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <p style={{ margin: "2px 0 0" }}>{comment.content}</p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          fontSize: 13,
          marginTop: 4,
          marginLeft: 4,
        }}
      >
        <button
          type="button"
          onClick={() => onLikeToggle(comment)}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            color: comment.likedByMe ? "#377DFF" : "#666",
            cursor: "pointer",
            fontWeight: comment.likedByMe ? 600 : 400,
          }}
        >
          {comment.likedByMe ? "Liked" : "Like"}
        </button>
        <LikesPopover
          count={comment.likesCount}
          fetchLikes={() => fetchCommentLikes(comment.id)}
        />
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          style={{ border: "none", background: "none", padding: 0, color: "#666", cursor: "pointer" }}
        >
          Reply
        </button>
        {isOwn && !editing && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{ border: "none", background: "none", padding: 0, color: "#666", cursor: "pointer" }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              style={{ border: "none", background: "none", padding: 0, color: "#dc3545", cursor: "pointer" }}
            >
              Delete
            </button>
          </>
        )}
      </div>

      {replying && (
        <form onSubmit={submitReply} style={{ marginTop: 6, marginLeft: 4 }}>
          <input
            className="form-control"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary mt-1">
            Reply
          </button>
        </form>
      )}

      {children.map((child) => (
        <CommentNode
          key={child.id}
          comment={child}
          allComments={allComments}
          currentUserId={currentUserId}
          onReply={onReply}
          onLikeToggle={onLikeToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
