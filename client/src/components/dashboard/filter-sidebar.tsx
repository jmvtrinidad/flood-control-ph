import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ProjectFilters, Project } from '@/types/project';

interface FilterSidebarProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: Partial<ProjectFilters>) => void;
  onClearFilters: () => void;
  projects?: Project[];
}

export function FilterSidebar({ filters, onFiltersChange, onClearFilters, projects = [] }: FilterSidebarProps) {
  // Get unique locations from projects data
  const uniqueLocations = Array.from(new Set(projects.map(p => p.location))).sort();

  return (
    <aside className="w-80 border-r border-border bg-card/30 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        </div>

        {/* Cost Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cost Range</Label>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minCost || ''}
                onChange={(e) => onFiltersChange({ minCost: e.target.value ? Number(e.target.value) : undefined })}
                data-testid="input-min-cost"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxCost || ''}
                onChange={(e) => onFiltersChange({ maxCost: e.target.value ? Number(e.target.value) : undefined })}
                data-testid="input-max-cost"
              />
            </div>
          </div>
        </div>

        {/* Region Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Region</Label>
          <Select
            value={filters.region || ''}
            onValueChange={(value) => onFiltersChange({ region: value === 'all' ? undefined : value })}
          >
            <SelectTrigger data-testid="select-region">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="NCR">National Capital Region</SelectItem>
              <SelectItem value="Region I">Region I - Ilocos</SelectItem>
              <SelectItem value="Region II">Region II - Cagayan Valley</SelectItem>
              <SelectItem value="Region III">Region III - Central Luzon</SelectItem>
              <SelectItem value="Region IV-A">Region IV-A - CALABARZON</SelectItem>
              <SelectItem value="Region IV-B">Region IV-B - MIMAROPA</SelectItem>
              <SelectItem value="Region V">Region V - Bicol</SelectItem>
              <SelectItem value="Region VI">Region VI - Western Visayas</SelectItem>
              <SelectItem value="Region VII">Region VII - Central Visayas</SelectItem>
              <SelectItem value="Region VIII">Region VIII - Eastern Visayas</SelectItem>
              <SelectItem value="Region IX">Region IX - Zamboanga Peninsula</SelectItem>
              <SelectItem value="Region X">Region X - Northern Mindanao</SelectItem>
              <SelectItem value="Region XI">Region XI - Davao</SelectItem>
              <SelectItem value="Region XII">Region XII - SOCCSKSARGEN</SelectItem>
              <SelectItem value="Region XIII">Region XIII - Caraga</SelectItem>
              <SelectItem value="BARMM">BARMM</SelectItem>
              <SelectItem value="CAR">CAR - Cordillera</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contractor Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Contractor</Label>
          <Select
            value={filters.contractor || ''}
            onValueChange={(value) => onFiltersChange({ contractor: value === 'all' ? undefined : value })}
          >
            <SelectTrigger data-testid="select-contractor">
              <SelectValue placeholder="All Contractors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contractors</SelectItem>
              <SelectItem value="DMCI Holdings">DMCI Holdings</SelectItem>
              <SelectItem value="Megawide Construction">Megawide Construction</SelectItem>
              <SelectItem value="D.M. Consunji Inc.">D.M. Consunji Inc.</SelectItem>
              <SelectItem value="EEI Corporation">EEI Corporation</SelectItem>
              <SelectItem value="San Miguel Corp.">San Miguel Corp.</SelectItem>
              <SelectItem value="JG Summit Holdings">JG Summit Holdings</SelectItem>
              <SelectItem value="Ayala Corporation">Ayala Corporation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fiscal Year Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Fiscal Year</Label>
          <Select
            value={filters.fiscalYear || ''}
            onValueChange={(value) => onFiltersChange({ fiscalYear: value === 'all' ? undefined : value })}
          >
            <SelectTrigger data-testid="select-fiscal-year">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
              <SelectItem value="2019">2019</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Location</Label>
          <Select
            value={filters.location || ''}
            onValueChange={(value) => onFiltersChange({ location: value === 'all' ? undefined : value })}
          >
            <SelectTrigger data-testid="select-location">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


      </div>
    </aside>
  );
}
