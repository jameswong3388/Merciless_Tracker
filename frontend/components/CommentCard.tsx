import { Comment } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
}

export function CommentCard({ comment, isReply = false }: CommentCardProps) {
  return (
    <div className={`${isReply ? "ml-12 mt-3" : "mt-3"}`}>
      <Card className="border-0 border-t border-gray-100 hover:bg-gray-50 transition-colors">
        <CardHeader className="flex flex-row items-start space-x-3 p-3 pb-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.profileImage} alt={comment.author.name} />
            <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-semibold text-sm">{comment.author.name}</span>
                <span className="ml-1.5 text-xs text-gray-500">@{comment.author.username}</span>
                <span className="mx-1.5 text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 pl-14">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
        </CardContent>
        <CardFooter className="flex justify-start p-2 pl-14 gap-4">
          <Button variant="ghost" size="sm" className="h-7 flex items-center space-x-1 rounded-full hover:text-blue-500 hover:bg-blue-50">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Reply</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 flex items-center space-x-1 rounded-full hover:text-red-500 hover:bg-red-50">
            <Heart className="h-3.5 w-3.5" />
            <span className="text-xs">{comment.likes}</span>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Render nested comments/replies if they exist */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies mt-1">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
} 