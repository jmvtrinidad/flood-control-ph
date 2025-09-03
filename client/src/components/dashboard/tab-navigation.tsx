import { Button } from '@/components/ui/button';
import { BarChart, Table, TrendingUp, Map } from 'lucide-react';

type Tab = 'overview' | 'data-table' | 'analytics' | 'map';

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart },
    { id: 'data-table' as Tab, label: 'Data Table', icon: Table },
    { id: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
    { id: 'map' as Tab, label: 'Map View', icon: Map },
  ];

  return (
    <div className="border-b border-border bg-card/30">
      <nav className="px-6 py-3">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`px-1 py-2 text-sm font-medium border-b-2 rounded-none ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}
