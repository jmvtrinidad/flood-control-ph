import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Building, DollarSign, Calculator, MapPin, TrendingUp, TrendingDown, ArrowRight, Download, Expand } from 'lucide-react';
import { useAnalytics } from '@/hooks/use-projects';
import { useProjectsByReactions } from '@/hooks/use-projects-by-reactions';
import { formatCurrency, formatNumber } from '@/lib/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { ContractorList } from './contractor-list';
import { ProjectsByReactionsWidget } from './projects-by-reactions-widget';
import { UserLeaderboardWidget } from './user-leaderboard-widget';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Project, ProjectFilters } from '@/types/project';

interface OverviewTabProps {
  projects: Project[];
  isLoading: boolean;
  filters?: ProjectFilters;
  onLocationClick?: (location: string) => void;
  onRegionClick?: (region: string) => void;
  onContractorSelect?: (contractor: string) => void;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function OverviewTab({ projects, isLoading, filters, onLocationClick, onRegionClick, onContractorSelect }: OverviewTabProps) {
  const [useFullCost, setUseFullCost] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const analyticsFilters = {
    ...filters, // Include global filters (including search)
    useFullCostForJointVentures: useFullCost
  };

  const locationAnalyticsFilters = {
    ...filters, // Include global filters (including search)
    useFullCostForJointVentures: useFullCost,
    ...(selectedRegion && { region: selectedRegion })
  };

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(analyticsFilters);
  const { data: locationAnalytics, isLoading: locationAnalyticsLoading } = useAnalytics(locationAnalyticsFilters);
  const { data: projectsByReactions, isLoading: reactionsLoading } = useProjectsByReactions(undefined, analyticsFilters);

  if (isLoading || analyticsLoading || locationAnalyticsLoading || reactionsLoading) {
    return (
      <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-4 md:space-y-6`}>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6`}>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className={`${isMobile ? 'h-48' : 'h-64'} w-full`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalProjects = analytics?.totalProjects || 0;
  const totalCost = analytics?.totalCost || 0;
  const avgCost = analytics?.avgCost || 0;
  const activeRegions = analytics?.activeRegions || 0;

  // Prepare chart data - always show regions
  const regionChartData = analytics?.projectsByRegion?.slice(0, 10).map(item => ({
    name: item.region.length > 15 ? item.region.substring(0, 15) + '...' : item.region,
    fullName: item.region,
    cost: item.cost / 1e9, // Convert to billions
    count: item.count
  })) || [];

  // Prepare location chart data for selected region
  const locationChartData = locationAnalytics?.projectsByLocation?.slice(0, 10).map(item => ({
    name: item.location.length > 15 ? item.location.substring(0, 15) + '...' : item.location,
    fullName: item.location,
    cost: item.cost / 1e9, // Convert to billions
    count: item.count
  })) || [];

  const contractorData = analytics?.projectsByContractor?.slice(0, 8).map((item, index) => ({
    contractor: item.contractor.length > 20 ? item.contractor.substring(0, 20) + '...' : item.contractor,
    count: item.count,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const fiscalYearData = analytics?.projectsByFiscalYear?.sort((a, b) => a.fy.localeCompare(b.fy)).map(item => ({
    year: item.fy,
    cost: item.cost / 1e9, // Convert to billions
    count: item.count
  })) || [];

  // Recent projects with ratings (showing first 3)
  const projectsWithRatings = projectsByReactions ?
    projectsByReactions.flatMap(group => group.projects).slice(0, 3) : [];

  // Use analytics data for contractors (filtered and not dependent on reactions)
  const contractorsData = analytics?.projectsByContractor?.map(item => ({
    contractor: item.contractor,
    count: item.count,
    cost: item.cost
  })) || [];

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-4 md:space-y-6`} data-testid="overview-tab">
      {/* Summary Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6`}>
        <Card data-testid="card-total-projects">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Total Projects</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>{formatNumber(totalProjects)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500"><TrendingUp className="inline h-3 w-3 mr-1" />12%</span> from last year
                </p>
              </div>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-primary/10 rounded-lg flex items-center justify-center`}>
                <Building className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-investment">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Total Investment</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>{formatCurrency(totalCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500"><TrendingUp className="inline h-3 w-3 mr-1" />18%</span> from last year
                </p>
              </div>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-accent/10 rounded-lg flex items-center justify-center`}>
                <DollarSign className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-accent`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-cost">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Avg. Cost</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>{formatCurrency(avgCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500"><TrendingUp className="inline h-3 w-3 mr-1" />5%</span> from last year
                </p>
              </div>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-chart-3/10 rounded-lg flex items-center justify-center`}>
                <Calculator className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-chart-3`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-regions">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Active Regions</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>{activeRegions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-blue-500">All regions</span> covered
                </p>
              </div>
              <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-chart-4/10 rounded-lg flex items-center justify-center`}>
                <MapPin className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-chart-4`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-3 gap-6'}`}>
        {/* Cost by Region Chart */}
        <Card data-testid="chart-cost-by-region">
          <CardHeader className={isMobile ? 'pb-3' : ''}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <CardTitle>Investment by Region</CardTitle>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className={isMobile ? 'p-2' : ''}>
                  <Download className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
                <Button variant="ghost" size="sm" className={isMobile ? 'p-2' : ''}>
                  <Expand className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={isMobile ? 'h-48' : 'h-64'}>
              {regionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionChartData} onClick={(data, index) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clickedItem = data.activePayload[0].payload;
                      // Click on region - set selected region to show locations
                      setSelectedRegion(clickedItem.fullName);
                      onRegionClick?.(clickedItem.fullName);
                    }
                  }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
                    <YAxis fontSize={isMobile ? 10 : 12} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `₱${value.toFixed(1)}B`,
                        name === 'cost' ? 'Investment' : 'Projects'
                      ]}
                    />
                    <Bar
                      dataKey="cost"
                      fill="hsl(var(--primary))"
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">No data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment by Location Chart */}
        <Card data-testid="chart-cost-by-location">
          <CardHeader className={isMobile ? 'pb-3' : ''}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <CardTitle>Investment by Location</CardTitle>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className={isMobile ? 'p-2' : ''}>
                  <Download className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
                <Button variant="ghost" size="sm" className={isMobile ? 'p-2' : ''}>
                  <Expand className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={isMobile ? 'h-48' : 'h-64'}>
              {analytics?.projectsByLocation && analytics.projectsByLocation.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.projectsByLocation.slice(0, 10).map(item => ({
                    name: item.location.length > 15 ? item.location.substring(0, 15) + '...' : item.location,
                    fullName: item.location,
                    cost: item.cost / 1e9, // Convert to billions
                    count: item.count
                  }))} onClick={(data, index) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clickedItem = data.activePayload[0].payload;
                      // Click on location - update sidebar filter and redirect to data table
                      onLocationClick?.(clickedItem.fullName);
                    }
                  }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
                    <YAxis fontSize={isMobile ? 10 : 12} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `₱${value.toFixed(1)}B`,
                        name === 'cost' ? 'Investment' : 'Projects'
                      ]}
                    />
                    <Bar
                      dataKey="cost"
                      fill="hsl(var(--primary))"
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">No location data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Timeline Analysis Chart */}
        <Card data-testid="chart-project-timeline">
          <CardHeader className={isMobile ? 'pb-3' : ''}>
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
              <CardTitle>Project Timeline Analysis</CardTitle>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className={isMobile ? 'p-2' : ''}>
                  <Download className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
                <Button variant="ghost" size="sm" className={isMobile ? 'p-2' : ''}>
                  <Expand className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={isMobile ? 'h-48' : 'h-64'}>
              {fiscalYearData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fiscalYearData}>
                    <defs>
                      <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      fontSize={isMobile ? 10 : 12}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                      height={isMobile ? 60 : 40}
                    />
                    <YAxis fontSize={isMobile ? 10 : 12} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'cost' ? `₱${value.toFixed(1)}B` : value,
                        name === 'cost' ? 'Investment' : 'Projects'
                      ]}
                      labelFormatter={(label) => `FY ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#timelineGradient)"
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">No timeline data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>



      {/* Top Rated Contractors */}
      <div className="grid grid-cols-1 gap-6">
        <ContractorList
          contractors={contractorsData}
          title="Top Rated Contractors"
          useFullCost={useFullCost}
          onUseFullCostChange={setUseFullCost}
          onContractorSelect={onContractorSelect}
        />
      </div>

      {/* Projects by Reactions and User Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectsByReactionsWidget />
        <UserLeaderboardWidget />
      </div>
    </div>
  );
}
