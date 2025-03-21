import { Tweet } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Repeat2, Heart, BarChart2, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TweetCardProps {
  tweet: Tweet;
}

export function TweetCard({ tweet }: TweetCardProps) {
  return (
    <Card className="mb-4 border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-start space-x-4 p-4 pb-2">
        <Avatar className="h-12 w-12 border-2 border-background">
          <AvatarImage src={tweet.author.profileImage} alt={tweet.author.name} />
          <AvatarFallback>{tweet.author.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">{tweet.author.name}</span>
              <span className="ml-2 text-sm text-gray-500">@{tweet.author.username}</span>
            </div>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="whitespace-pre-wrap text-base leading-relaxed">{tweet.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between p-3 text-gray-500 border-t">
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 rounded-full hover:text-blue-500 hover:bg-blue-50">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{tweet.comments.length}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 rounded-full hover:text-green-500 hover:bg-green-50">
          <Repeat2 className="h-4 w-4" />
          <span className="text-xs">{tweet.retweets}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 rounded-full hover:text-red-500 hover:bg-red-50">
          <Heart className="h-4 w-4" />
          <span className="text-xs">{tweet.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 rounded-full hover:text-blue-500 hover:bg-blue-50">
          <BarChart2 className="h-4 w-4" />
          <span className="text-xs">{tweet.views}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 rounded-full hover:text-blue-500 hover:bg-blue-50">
          <Share className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 