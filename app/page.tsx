/** @format */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Post {
  id: string;
  text: string;
  laugh: number;
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch posts from backend
  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Create new post
  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newPost }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      const post = await res.json();
      setPosts((prev) => [post, ...prev]); // Add new post at top
      setNewPost("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaugh = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, laugh: p.laugh + 1 } : p))
    );

    try {
      const res = await fetch(`/api/post/${id}/laugh`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update laugh");
    } catch (err) {
      console.error(err);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, laugh: p.laugh - 1 } : p))
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-7xl flex-col items-center justify-start py-12 lg:py-20 px-4 md:px-8 lg:px-16 bg-white dark:bg-black">
        <div className="mb-12 text-center space-y-4 w-full max-w-md">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Let the roasting begin!
          </h1>
          <p className="text-lg text-muted-foreground">
            Roast the chain, product, your friends or your boss anonymously!
          </p>

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Write your roast..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <Button onClick={handleCreatePost} disabled={loading}>
              {loading ? "Posting..." : "Post +"}
            </Button>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <Card key={post.id} className="flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>Roast #{index + 1}</CardTitle>
                  <CardDescription>
                    {new Date(post.createdAt).toLocaleString()} · Anonymous
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>{post.text}</p>
                </CardContent>
                <CardFooter className="flex-shrink-0 pt-4">
                  <button
                    onClick={() => handleLaugh(post.id)}
                    className="text-sm font-medium text-primary hover:underline cursor-pointer"
                  >
                    🤣 {post.laugh}
                  </button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center w-full">
              No roasts yet. Be the first to roast 🔥
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
