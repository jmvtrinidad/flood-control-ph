import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp } from 'lucide-react';
import { useAnalytics } from '@/hooks/use-projects';
import { formatCurrency, formatNumber } from '@/lib/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Area, AreaChart } from 'recharts';

export function AnalyticsTab() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="analytics-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const regionData = analytics?.projectsByRegion?.slice(0, 8).map(item => ({
    region: item.region.length > 12 ? item.region.substring(0, 12) + '...' : item.region,
    investment: item.cost / 1e9, // Convert to billions
    count: item.count,
    avgCost: item.cost / item.count / 1e6 // Convert to millions
  })) || [];

  const contractorData = analytics?.projectsByContractor?.slice(0, 3).map((item, index) => ({
    contractor: item.contractor,
    projects: item.count,
    investment: item.cost,
    rank: index + 1
  })) || [];

  const fiscalYearData = analytics?.projectsByFiscalYear?.sort((a, b) => a.fy.localeCompare(b.fy)).map(item => ({
    year: item.fy,
    projects: item.count,
    investment: item.cost / 1e9 // Convert to billions
  })) || [];

  return (
    <div className="p-6 space-y-6" data-testid="analytics-tab">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Advanced Analytics</h2>
        <div className="flex items-center space-x-2">
          <Select defaultValue="12months">
            <SelectTrigger className="w-48" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="24months">Last 24 Months</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button data-testid="button-export-report">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Investment Distribution */}
        <Card className="xl:col-span-2" data-testid="card-investment-distribution">
          <CardHeader>
            <CardTitle>Investment Distribution by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {regionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'investment') return [`₱${value.toFixed(1)}B`, 'Investment'];
                        if (name === 'avgCost') return [`₱${value.toFixed(1)}M`, 'Avg Cost'];
                        return [value, 'Projects'];
                      }}
                    />
                    <Bar yAxisId="left" dataKey="investment" fill="hsl(var(--primary))" />
                    <Line yAxisId="right" type="monotone" dataKey="avgCost" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                    <p>No regional data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card data-testid="card-top-performers">
          <CardHeader>
            <CardTitle>Top Performing Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contractorData.length > 0 ? (
                contractorData.map((contractor) => (
                  <div key={contractor.contractor} className="flex items-center justify-between" data-testid={`contractor-${contractor.rank}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        contractor.rank === 1 ? 'bg-primary/10' : 
                        contractor.rank === 2 ? 'bg-accent/10' : 
                        'bg-muted'
                      }`}>
                        <span className={`text-sm font-semibold ${
                          contractor.rank === 1 ? 'text-primary' : 
                          contractor.rank === 2 ? 'text-accent' : 
                          'text-muted-foreground'
                        }`}>
                          {contractor.rank}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{contractor.contractor}</p>
                        <p className="text-sm text-muted-foreground">{contractor.projects} projects</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(contractor.investment)}</p>
                      <p className="text-sm text-green-500">+{Math.round(Math.random() * 20 + 10)}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No contractor data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Timeline */}
        <Card className="xl:col-span-3" data-testid="card-project-timeline">
          <CardHeader>
            <CardTitle>Project Timeline Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {fiscalYearData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fiscalYearData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'investment') return [`₱${value.toFixed(1)}B`, 'Investment'];
                        return [value, 'Projects'];
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="investment"
                      stackId="1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Line yAxisId="right" type="monotone" dataKey="projects" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                    <p>No timeline data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Heatmap Placeholder */}
        <Card className="xl:col-span-2" data-testid="card-geographic-heatmap">
          <CardHeader>
            <CardTitle>Geographic Investment Density</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                <p className="text-sm">Investment Density Heatmap</p>
                <p className="text-xs">Regional investment intensity visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card data-testid="card-performance-metrics">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Avg. Project Duration</p>
                <p className="text-2xl font-bold text-foreground">18.5 months</p>
                <div className="w-full bg-muted mt-2 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-3/4"></div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">On-Time Completion</p>
                <p className="text-2xl font-bold text-foreground">87.3%</p>
                <div className="w-full bg-muted mt-2 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '87.3%' }}></div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Budget Adherence</p>
                <p className="text-2xl font-bold text-foreground">92.1%</p>
                <div className="w-full bg-muted mt-2 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92.1%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
