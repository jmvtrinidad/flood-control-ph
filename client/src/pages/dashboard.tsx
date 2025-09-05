import { useState, useEffect } from 'react';
import type { Project } from '@/types/project';
import { DashboardHeader } from '@/components/dashboard/header';
import { FilterSidebar } from '@/components/dashboard/filter-sidebar';
import { TabNavigation } from '@/components/dashboard/tab-navigation';
import { OverviewTab } from '@/components/dashboard/overview-tab';
import { DataTableTab } from '@/components/dashboard/data-table-tab';
import { AnalyticsTab } from '@/components/dashboard/analytics-tab';
import { MapTab } from '@/components/dashboard/map-tab';
import { useProjects } from '@/hooks/use-projects';
import { useFilters } from '@/hooks/use-filters';

type Tab = 'overview' | 'data-table' | 'analytics' | 'map';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { filters, updateFilters, clearFilters } = useFilters();
  
  // Create combined filters including search
  const [searchQuery, setSearchQuery] = useState('');
  const combinedFilters = { ...filters, search: searchQuery };
  
  // Sync searchQuery with filters.search when filters are loaded from URL
  useEffect(() => {
    if (filters.search !== undefined) {
      setSearchQuery(filters.search);
    }
  }, [filters.search]);
  
  const { data: projects = [], isLoading } = useProjects(combinedFilters);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateFilters({ search: query || undefined });
  };

  const handleViewOnMap = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('map');
  };

  const handleLocationClick = (location: string) => {
    updateFilters({ location });
    setActiveTab('data-table');
  };

  const handleRegionClick = (region: string) => {
    updateFilters({ region });
    setActiveTab('data-table');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab projects={projects} isLoading={isLoading} filters={combinedFilters} onLocationClick={handleLocationClick} onRegionClick={handleRegionClick} />;
      case 'data-table':
        return <DataTableTab projects={projects} isLoading={isLoading} filters={combinedFilters} onViewOnMap={handleViewOnMap} />;
      case 'analytics':
        return <AnalyticsTab filters={combinedFilters} />;
      case 'map':
        return <MapTab projects={projects} isLoading={isLoading} selectedProject={selectedProject} />;
      default:
        return <OverviewTab projects={projects} isLoading={isLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      <DashboardHeader 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
      
      <div className="flex h-[calc(100vh-80px)]">
        <FilterSidebar 
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          projects={projects}
        />
        
        <main className="flex-1 overflow-hidden">
          <TabNavigation 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="h-[calc(100vh-140px)] overflow-y-auto bg-background">
            {renderTabContent()}
            
            {/* Disclaimer Footer */}
            <div className="border-t border-border bg-card/30 px-6 py-4 mt-8">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Disclaimer:</span> Please verify information from{' '}
                  <a 
                    href="https://sumbongsapangulo.ph" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    sumbongsapangulo.ph
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  For updates, email:{' '}
                  <a 
                    href="mailto:infloodcontrolph@gmail.com"
                    className="text-primary hover:underline"
                  >
                    infloodcontrolph@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}