import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserLeaderboard, useUserReactions, LeaderboardUser } from '@/hooks/useUserLeaderboard';
import { Trophy, Medal, Award, Star, ThumbsUp, AlertTriangle, Ghost, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

// Function to generate a random color based on username for anonymous avatar
function getRandomColor(username: string | null | undefined) {
  if (!username) return 'bg-gray-500';
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  return colors[Math.abs(hash) % colors.length];
}

function getRatingIcon(rating: string) {
  switch (rating) {
    case 'excellent': return <Star className="h-3 w-3" fill="currentColor" />;
    case 'standard': return <ThumbsUp className="h-3 w-3" />;
    case 'sub-standard': return <AlertTriangle className="h-3 w-3" />;
    case 'ghost': return <Ghost className="h-3 w-3" />;
    default: return null;
  }
}

function getRatingColor(rating: string) {
  switch (rating) {
    case 'excellent': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800';
    case 'standard': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800';
    case 'sub-standard': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800';
    case 'ghost': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800';
  }
}

function getRankIcon(index: number) {
  switch (index) {
    case 0: return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 1: return <Medal className="h-4 w-4 text-gray-400" />;
    case 2: return <Award className="h-4 w-4 text-amber-600" />;
    default: return <span className="font-semibold text-sm">#{index + 1}</span>;
  }
}

interface UserReactionDetailsProps {
  user: LeaderboardUser['user'];
  trigger: React.ReactNode;
}

function UserReactionDetails({ user, trigger }: UserReactionDetailsProps) {
  const { data: reactions, isLoading } = useUserReactions(user.id);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="user-reactions-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.username ? undefined : user.avatar || undefined} alt={user.name} />
              <AvatarFallback className={user.username ? getRandomColor(user.username) : ''}>
                {(user.username || user.name).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user.username || user.name}'s Reactions
          </DialogTitle>
          <DialogDescription>
            All reactions by {user.username || user.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : reactions && reactions.length > 0 ? (
            <div className="space-y-4">
              {reactions.map((reaction) => (
                <Card key={reaction.id} className="p-4" data-testid={`reaction-${reaction.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getRatingColor(reaction.rating)}>
                          {getRatingIcon(reaction.rating)}
                          <span className="ml-1 capitalize">{reaction.rating.replace('-', ' ')}</span>
                        </Badge>
                        {reaction.isProximityVerified && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm line-clamp-1">{reaction.project.projectName}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {reaction.project.location}
                          </span>
                          <span>by {reaction.project.contractor}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ₱{reaction.project.cost.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(reaction.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      {reaction.comment && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          "{reaction.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Ghost className="h-8 w-8 mx-auto mb-2" />
              <p>No reactions found</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function UserLeaderboardWidget() {
  const { data: leaderboard, isLoading, error } = useUserLeaderboard();

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load user leaderboard data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-1" data-testid="user-leaderboard-widget">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle>Top Contributors</CardTitle>
        </div>
        <CardDescription>Users with the most project reactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <UserReactionDetails
                key={entry.user.id}
                user={entry.user}
                trigger={
                  <Button
                    variant="ghost"
                    className="w-full p-3 h-auto justify-start hover:bg-muted/50"
                    data-testid={`user-leaderboard-item-${entry.user.id}`}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="flex-shrink-0">
                        {getRankIcon(index)}
                      </div>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={entry.user.username ? undefined : entry.user.avatar || undefined} alt={entry.user.name} />
                        <AvatarFallback className={entry.user.username ? getRandomColor(entry.user.username) : ''}>
                          {(entry.user.username || entry.user.name).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm truncate">
                          {entry.user.username || entry.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.reactionCount} reaction{entry.reactionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No user reactions yet</p>
            <p className="text-xs mt-1">Be the first to rate projects!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
