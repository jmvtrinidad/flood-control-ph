import { useQuery } from '@tanstack/react-query';

export interface LeaderboardUser {
  user: {
    id: string;
    name: string;
    username?: string | null;
    avatar?: string | null;
    provider: string;
  };
  reactionCount: number;
}

export interface UserReaction {
  id: string;
  rating: string;
  comment?: string;
  isProximityVerified: boolean;
  createdAt: string;
  project: {
    id: string;
    projectName: string;
    contractor: string;
    region: string;
    location: string;
    cost: number;
  };
}

export function useUserLeaderboard() {
  return useQuery<LeaderboardUser[]>({
    queryKey: ['/api/users/leaderboard'],
  });
}

export function useUserReactions(userId: string) {
  return useQuery<UserReaction[]>({
    queryKey: [`/api/users/${userId}/reactions`],
    enabled: !!userId,
  });
}
