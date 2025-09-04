import { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const combinedFilters = { ...filters, search: searchQuery };
  
  const { data: projects = [], isLoading } = useProjects(combinedFilters);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateFilters({ search: query || undefined });
  };

  const handleViewOnMap = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('map');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab projects={projects} isLoading={isLoading} />;
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
        />
        
        <main className="flex-1 overflow-hidden">
          <TabNavigation 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="h-[calc(100vh-140px)] overflow-y-auto bg-background">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
