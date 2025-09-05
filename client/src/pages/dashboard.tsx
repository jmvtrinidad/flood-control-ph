import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter, Menu } from 'lucide-react';

type Tab = 'overview' | 'data-table' | 'analytics' | 'map';

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { filters, updateFilters, clearFilters } = useFilters();
  const isMobile = useIsMobile();
  
  // Get tab from URL or default to 'overview'
  const getTabFromURL = (): Tab => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as Tab;
    return ['overview', 'data-table', 'analytics', 'map'].includes(tab) ? tab : 'overview';
  };
  
  const [activeTab, setActiveTabState] = useState<Tab>(getTabFromURL());
  
  // Update tab and URL
  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newURL);
  };
  
  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromURL());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // Initialize tab from URL on component mount
  useEffect(() => {
    const urlTab = getTabFromURL();
    if (urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
  }, []);
  
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
      <DashboardHeader />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <FilterSidebar 
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
            projects={projects}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        )}

        {/* Mobile Filter Sheet */}
        {isMobile && (
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <FilterSidebar 
                filters={filters}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
                projects={projects}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
              />
            </SheetContent>
          </Sheet>
        )}
        
        <main className="flex-1 overflow-hidden">
          {/* Mobile Filter Trigger */}
          {isMobile && (
            <div className="border-b border-border bg-card/30 px-4 py-2">
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-mobile-filters">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
              </Sheet>
            </div>
          )}

          <TabNavigation 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className={`overflow-y-auto bg-background ${
            isMobile ? 'h-[calc(100vh-180px)]' : 'h-[calc(100vh-140px)]'
          }`}>
            {renderTabContent()}
            
            {/* Disclaimer Footer */}
            <div className="border-t border-border bg-card/30 px-4 md:px-6 py-4 mt-8">
              <div className="text-center space-y-2">
                <p className="text-xs md:text-sm text-muted-foreground">
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
                <p className="text-xs md:text-sm text-muted-foreground">
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