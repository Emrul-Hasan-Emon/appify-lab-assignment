"use client";

import { deletePost, fetchPostLikes, likePost, unlikePost } from "@/lib/api";
import { Post } from "@/lib/types";
import CommentsSection from "./CommentsSection";
import LikesPopover from "./LikesPopover";

export default function PostCard({
  post,
  currentUserId,
  onChange,
  onRemove,
}: {
  post: Post;
  currentUserId: number;
  onChange: (post: Post) => void;
  onRemove: (postId: number) => void;
}) {
  const isOwn = post.author.id === currentUserId;

  async function toggleLike() {
    if (post.likedByMe) {
      await unlikePost(post.id);
    } else {
      await likePost(post.id);
    }
    onChange({
      ...post,
      likedByMe: !post.likedByMe,
      likesCount: post.likesCount + (post.likedByMe ? -1 : 1),
    });
  }

  async function handleDelete() {
    await deletePost(post.id);
    onRemove(post.id);
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong>
            {post.author.firstName} {post.author.lastName}
          </strong>
          <div style={{ fontSize: 12, color: "#999" }}>
            {new Date(post.createdAt).toLocaleString()} ·{" "}
            {post.visibility === "private" ? "Private" : "Public"}
          </div>
        </div>
        {isOwn && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-sm btn-outline-danger"
          >
            Delete
          </button>
        )}
      </div>

      {post.text && <p style={{ marginTop: 10 }}>{post.text}</p>}

      {post.media.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              post.media.length > 1 ? "1fr 1fr" : "1fr",
            gap: 8,
            marginTop: 10,
          }}
        >
          {post.media.map((media) =>
            media.mediaType === "video" ? (
              <video key={media.id} src={media.mediaUrl} controls style={{ width: "100%", borderRadius: 8 }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={media.id}
                src={media.mediaUrl}
                alt="Post media"
                style={{ width: "100%", borderRadius: 8, objectFit: "cover" }}
              />
            ),
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 12,
        }}
      >
        <button
          type="button"
          onClick={toggleLike}
          className={`btn btn-sm ${post.likedByMe ? "btn-primary" : "btn-outline-primary"}`}
        >
          {post.likedByMe ? "Liked" : "Like"}
        </button>
        <LikesPopover
          count={post.likesCount}
          fetchLikes={() => fetchPostLikes(post.id)}
        />
        <span style={{ color: "#666" }}>
          {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
        </span>
      </div>

      <CommentsSection
        postId={post.id}
        currentUserId={currentUserId}
        onCountChange={(delta) =>
          onChange({ ...post, commentsCount: post.commentsCount + delta })
        }
      />
    </div>
  );
}
