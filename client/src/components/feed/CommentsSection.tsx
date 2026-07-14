"use client";

import { useState } from "react";
import {
  createComment,
  deleteComment,
  fetchComments,
  likeComment,
  unlikeComment,
  updateComment,
} from "@/lib/api";
import { Comment } from "@/lib/types";
import CommentNode from "./CommentNode";

export default function CommentsSection({
  postId,
  currentUserId,
  onCountChange,
}: {
  postId: number;
  currentUserId: number;
  onCountChange: (delta: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  async function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!loaded) {
      setComments(await fetchComments(postId));
      setLoaded(true);
    }
  }

  async function submitTopLevel(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const created = await createComment(postId, { content: newComment.trim() });
    setComments((prev) => [...prev, created]);
    setNewComment("");
    onCountChange(1);
  }

  async function handleReply(parentId: number, content: string) {
    const created = await createComment(postId, { content, parentId });
    setComments((prev) => [...prev, created]);
    onCountChange(1);
  }

  async function handleLikeToggle(comment: Comment) {
    if (comment.likedByMe) {
      await unlikeComment(comment.id);
    } else {
      await likeComment(comment.id);
    }
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              likedByMe: !c.likedByMe,
              likesCount: c.likesCount + (c.likedByMe ? -1 : 1),
            }
          : c,
      ),
    );
  }

  async function handleEdit(commentId: number, content: string) {
    const updated = await updateComment(commentId, content);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
  }

  async function handleDelete(commentId: number) {
    await deleteComment(commentId);
    setComments((prev) => {
      const removedIds = new Set([commentId]);
      // a deleted comment cascades its whole reply subtree server-side; mirror that here
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of prev) {
          if (c.parentId && removedIds.has(c.parentId) && !removedIds.has(c.id)) {
            removedIds.add(c.id);
            changed = true;
          }
        }
      }
      onCountChange(-removedIds.size);
      return prev.filter((c) => !removedIds.has(c.id));
    });
  }

  const rootComments = comments.filter((c) => !c.parentId);

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={toggleOpen}
        className="btn btn-sm btn-light"
      >
        {open ? "Hide comments" : "View comments"}
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          <form onSubmit={submitTopLevel} className="mb-2">
            <input
              className="form-control"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary mt-1">
              Comment
            </button>
          </form>

          {rootComments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              allComments={comments}
              currentUserId={currentUserId}
              onReply={handleReply}
              onLikeToggle={handleLikeToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
