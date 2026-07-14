"use client";

import { useState } from "react";
import { createPost } from "@/lib/api";
import { Post } from "@/lib/types";

export default function CreatePostForm({
  onCreated,
}: {
  onCreated: (post: Post) => void;
}) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setSubmitting(true);
    setError("");
    try {
      const post = await createPost({ text: text.trim(), visibility, files });
      onCreated(post);
      setText("");
      setFiles([]);
      setVisibility("public");
    } catch {
      setError("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <textarea
        className="form-control"
        placeholder="What's on your mind?"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />

        <select
          className="form-select"
          style={{ width: 140 }}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "public" | "private")}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <button
          type="submit"
          id="create-post-submit"
          className="btn btn-primary ms-auto"
          disabled={submitting}
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>

      {files.length > 0 && (
        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
          {files.length} file(s) selected
        </div>
      )}
      {error && (
        <div style={{ color: "#dc3545", marginTop: 6 }}>{error}</div>
      )}
    </form>
  );
}
