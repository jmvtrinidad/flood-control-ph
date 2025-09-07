import { Button } from '@/components/ui/button';
import { BarChart, Table, TrendingUp, Map } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type Tab = 'overview' | 'data-table' | 'map';

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const isMobile = useIsMobile();

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', shortLabel: 'Overview', icon: BarChart },
    { id: 'data-table' as Tab, label: 'Data Table', shortLabel: 'Table', icon: Table },
    { id: 'map' as Tab, label: 'Map View', shortLabel: 'Map', icon: Map },
  ];

  return (
    <div className="border-b border-border bg-card/30">
      <nav className="px-4 md:px-6 py-3">
        <div className={`flex ${isMobile ? 'space-x-1 overflow-x-auto scrollbar-hide' : 'space-x-8'}`}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`${isMobile ? 'px-3 py-2 text-xs min-w-max' : 'px-1 py-2 text-sm'} font-medium border-b-2 rounded-none whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
              {isMobile ? tab.shortLabel : tab.label}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}
