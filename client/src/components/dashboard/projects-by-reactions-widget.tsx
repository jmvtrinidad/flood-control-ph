import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, MapPin, Star, TrendingUp, ArrowUpDown } from 'lucide-react';
import { useProjectsByReactions } from '@/hooks/use-projects-by-reactions';
import { formatCurrency } from '@/lib/analytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

export function ProjectsByReactionsWidget() {
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState('highest-rated');
  const { data: contractorGroups, isLoading } = useProjectsByReactions(sortBy);

  const getRatingColor = (score: number) => {
    if (score >= 3.5) return 'bg-green-100 text-green-800';
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-800';
    if (score >= 1.5) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getRatingIcon = (score: number) => {
    if (score >= 3.5) return <Star className="h-3 w-3 fill-current" />;
    if (score >= 2.5) return <TrendingUp className="h-3 w-3" />;
    return <MapPin className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2 pl-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contractorGroups || contractorGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Projects by Reactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">No reaction data available</p>
            <p className="text-xs">Projects will appear here when users provide feedback</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show top 5 contractors (already sorted by server)
  const topContractors = contractorGroups.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Top Projects by User Reactions
          </CardTitle>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40" data-testid="select-sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highest-rated">Highest Rated</SelectItem>
                <SelectItem value="most-rated">Most Rated</SelectItem>
                <SelectItem value="highest-ghost">Most Ghost Projects</SelectItem>
                <SelectItem value="most-controversial">Most Controversial</SelectItem>
                <SelectItem value="recent-rated">Recently Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topContractors.map((contractorGroup, index) => (
            <div key={contractorGroup.contractor} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <h4 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} truncate max-w-[200px]`}>
                    {contractorGroup.contractor}
                  </h4>
                </div>
                {contractorGroup.bestScore && contractorGroup.bestScore > 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRatingColor(contractorGroup.bestScore)}`}>
                    {getRatingIcon(contractorGroup.bestScore)}
                    {Number(contractorGroup.bestScore).toFixed(1)}
                  </div>
                )}
              </div>

              {/* Show top 3 projects for each contractor */}
              <div className="space-y-2 pl-4">
                {contractorGroup.projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} text-foreground truncate`}>
                        {project.projectname}
                      </p>
                      <div className={`flex items-center gap-3 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.region}
                        </span>
                        <span className="truncate max-w-[120px]">
                          {project.location}
                        </span>
                      </div>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                        {formatCurrency(parseFloat(project.cost))}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      {project.averageReactionScore && project.averageReactionScore > 0 ? (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRatingColor(project.averageReactionScore)}`}>
                          {getRatingIcon(project.averageReactionScore)}
                          {Number(project.averageReactionScore).toFixed(1)}
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No ratings
                        </Badge>
                      )}
                      {project.reactionCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {project.reactionCount} review{project.reactionCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {contractorGroup.projects.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-3">
                    +{contractorGroup.projects.length - 3} more project{contractorGroup.projects.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}

          {contractorGroups.length > 5 && (
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                +{contractorGroups.length - 5} more contractor{contractorGroups.length - 5 !== 1 ? 's' : ''} with ratings
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
