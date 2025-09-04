import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, DollarSign, Calculator, MapPin, TrendingUp, TrendingDown, ArrowRight, Download, Expand } from 'lucide-react';
import { useAnalytics } from '@/hooks/use-projects';
import { formatCurrency, formatNumber } from '@/lib/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Project } from '@/types/project';

interface OverviewTabProps {
  projects: Project[];
  isLoading: boolean;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function OverviewTab({ projects, isLoading }: OverviewTabProps) {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();

  if (isLoading || analyticsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
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

  // Prepare chart data
  const regionData = analytics?.projectsByRegion?.slice(0, 10).map(item => ({
    region: item.region.length > 15 ? item.region.substring(0, 15) + '...' : item.region,
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

  // Recent projects (showing first 3)
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="p-6 space-y-6" data-testid="overview-tab">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-total-projects">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-foreground">{formatNumber(totalProjects)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500"><TrendingUp className="inline h-3 w-3 mr-1" />12%</span> from last year
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-investment">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500"><TrendingUp className="inline h-3 w-3 mr-1" />18%</span> from last year
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-cost">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Cost</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(avgCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500"><TrendingUp className="inline h-3 w-3 mr-1" />5%</span> from last year
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-regions">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Regions</p>
                <p className="text-2xl font-bold text-foreground">{activeRegions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-blue-500">All regions</span> covered
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Region Chart */}
        <Card data-testid="chart-cost-by-region">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Investment by Region</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Expand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {regionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `₱${value.toFixed(1)}B`,
                        name === 'cost' ? 'Investment' : 'Projects'
                      ]}
                    />
                    <Bar dataKey="cost" fill="hsl(var(--primary))" />
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

        {/* Projects by Contractor */}
        <Card data-testid="chart-projects-by-contractor">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projects by Contractor</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Expand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {contractorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ contractor, count }) => `${contractor}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {contractorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
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

        {/* Timeline Analysis */}
        <Card className="lg:col-span-2" data-testid="chart-timeline">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Investment Timeline</CardTitle>
              <div className="flex items-center space-x-2">
                <select className="px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Last 5 Years</option>
                  <option>Last 10 Years</option>
                  <option>All Time</option>
                </select>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {fiscalYearData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fiscalYearData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'cost' ? `₱${value.toFixed(1)}B` : value,
                        name === 'cost' ? 'Investment' : 'Projects'
                      ]}
                    />
                    <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
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

      {/* Recent Projects */}
      <Card data-testid="recent-projects">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-view-all">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project, index) => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`project-item-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{project.projectname}</p>
                      <p className="text-sm text-muted-foreground">{project.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(parseFloat(project.cost))}</p>
                    <p className="text-sm text-muted-foreground">{project.contractor}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No projects available</p>
                <p className="text-xs">Upload data to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
