"use client";

import { useState } from "react";
import { AuthUser } from "@/lib/types";

export default function LikesPopover({
  count,
  fetchLikes,
}: {
  count: number;
  fetchLikes: () => Promise<AuthUser[]>;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!users) {
      setLoading(true);
      try {
        setUsers(await fetchLikes());
      } finally {
        setLoading(false);
      }
    }
  }

  if (count === 0) {
    return <span style={{ color: "#666" }}>0 likes</span>;
  }

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          border: "none",
          background: "none",
          color: "#377DFF",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {count} {count === 1 ? "like" : "likes"}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 10,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "8px 12px",
            minWidth: 160,
          }}
        >
          {loading && <div>Loading...</div>}
          {!loading && users?.length === 0 && <div>No likes yet</div>}
          {!loading &&
            users?.map((u) => (
              <div key={u.id} style={{ padding: "2px 0" }}>
                {u.firstName} {u.lastName}
              </div>
            ))}
        </div>
      )}
    </span>
  );
}
