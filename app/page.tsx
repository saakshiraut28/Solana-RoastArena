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
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";

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
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

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

    if (!publicKey) {
      alert("Please connect your Solana wallet first!");
      return;
    }

    if (!signTransaction) {
      alert("Wallet does not support signing transactions");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Request payment quote (will get 402)
      let res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newPost }),
      });

      if (res.status !== 402) {
        throw new Error("Expected payment request");
      }

      alert("402 Payment required! Preparing transaction...");

      const quote = await res.json();
      console.log("Payment required:", quote.payment);

      // Step 2: Create payment transaction
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(quote.payment.recipient),
          lamports: quote.payment.amount,
        })
      );

      // Step 3: Sign transaction (but don't send it!)
      const signedTx = await signTransaction(transaction);

      // Step 4: Serialize the signed transaction
      const serializedTx = signedTx.serialize().toString("base64");

      // Step 5: Create x402 payment proof
      const paymentProof = {
        x402Version: 1,
        scheme: "exact",
        network:
          quote.payment.cluster === "devnet"
            ? "solana-devnet"
            : "solana-mainnet",
        payload: {
          serializedTransaction: serializedTx,
        },
      };

      // Step 6: Encode payment proof as base64
      const xPaymentHeader = btoa(JSON.stringify(paymentProof));

      console.log("Sending payment proof to server...");

      // Step 7: Retry post with X-Payment header
      res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPaymentHeader,
        },
        body: JSON.stringify({ text: newPost }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create post");
      }

      const result = await res.json();

      console.log("✅ Post created!", result);
      console.log("🔗 Transaction:", result.paymentDetails.explorerUrl);

      // Update UI
      setPosts((prev) => [result.post, ...prev]);
      setNewPost("");

      // Show success message with explorer link
      alert(
        `Roast posted! 🔥\n\nTransaction: ${result.paymentDetails.signature.slice(
          0,
          8
        )}...`
      );
    } catch (err) {
      console.error("Error:", err);
      alert(`Failed to create post: ${(err as Error).message}`);
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
