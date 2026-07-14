"use client";

import { useEffect, useState } from "react";
import { fetchFeed } from "@/lib/api";
import { getUser } from "@/lib/session";
import { Post } from "@/lib/types";
import CreatePostForm from "./CreatePostForm";
import PostCard from "./PostCard";

export default function FeedApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const currentUserId = getUser()?.id ?? 0;

  useEffect(() => {
    fetchFeed().then((page) => {
      setPosts(page.items);
      setNextCursor(page.nextCursor);
      setLoading(false);
    });
  }, []);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const page = await fetchFeed(nextCursor);
    setPosts((prev) => [...prev, ...page.items]);
    setNextCursor(page.nextCursor);
    setLoadingMore(false);
  }

  function handleCreated(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleChange(updated: Post) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleRemove(postId: number) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return (
    <div>
      <CreatePostForm onCreated={handleCreated} />

      {loading && <p>Loading feed...</p>}

      {!loading && posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onChange={handleChange}
          onRemove={handleRemove}
        />
      ))}

      {nextCursor && (
        <button
          type="button"
          onClick={loadMore}
          className="btn btn-outline-secondary w-100"
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
