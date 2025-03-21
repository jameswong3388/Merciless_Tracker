import { Suspense } from "react";
import { TweetCard } from "@/components/TweetCard";
import { CommentCard } from "@/components/CommentCard";
import { mockTweet } from "@/lib/mockData";
import { Separator } from "@/components/ui/separator";
import { NewCommentInput } from "@/components/NewCommentInput";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TweetPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="sticky top-0 z-10 flex items-center pt-2 pb-3 mb-2 bg-background/90 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="mr-2" asChild>
          <a href="/">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <h1 className="font-semibold">Tweet</h1>
      </div>
      
      <div className="tweet-container space-y-4" id="tweet-container">
        <TweetCard tweet={mockTweet} />
        
        <div className="comments-section rounded-xl border p-4 bg-card" id="comments-section">
          <h3 className="font-semibold text-lg mb-4">Comments</h3>
          
          <div className="mb-4">
            <NewCommentInput />
          </div>
          
          <Separator className="my-4" />
          
          <div className="comments space-y-2" id="comments-list">
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading comments...</div>}>
              {mockTweet.comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
