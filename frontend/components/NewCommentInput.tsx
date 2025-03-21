"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUser } from "@/lib/mockData";

export function NewCommentInput() {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically submit the comment
    console.log("Submitting comment:", comment);
    setComment("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
        <AvatarImage src={mockUser.profileImage} alt={mockUser.name} />
        <AvatarFallback>{mockUser.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Textarea
          placeholder="Write a comment..."
          className="min-h-[80px] resize-none"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!comment.trim()} 
            className="rounded-full"
          >
            Comment
          </Button>
        </div>
      </div>
    </form>
  );
} 