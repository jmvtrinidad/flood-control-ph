import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, Upload, RotateCcw, CloudDownload } from 'lucide-react';
import type { ProjectFilters } from '@/types/project';
import { useUploadFile, useClearProjects } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';

interface FilterSidebarProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: Partial<ProjectFilters>) => void;
  onClearFilters: () => void;
}

export function FilterSidebar({ filters, onFiltersChange, onClearFilters }: FilterSidebarProps) {
  const uploadFile = useUploadFile();
  const clearProjects = useClearProjects();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JSON file',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await uploadFile.mutateAsync(file);
      toast({
        title: 'Upload successful',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all project data? This action cannot be undone.')) {
      try {
        await clearProjects.mutateAsync();
        toast({
          title: 'Data cleared',
          description: 'All project data has been cleared successfully',
        });
      } catch (error) {
        toast({
          title: 'Failed to clear data',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      }
    }
  };

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

        {/* Location Search */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Location Search</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search by city or area..."
              value={filters.location || ''}
              onChange={(e) => onFiltersChange({ location: e.target.value || undefined })}
              className="pl-10"
              data-testid="input-location"
            />
          </div>
        </div>

        {/* Data Source */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Data Source</Label>
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => window.location.reload()}
              disabled={clearProjects.isPending}
              data-testid="button-refresh-data"
            >
              <CloudDownload className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <label className="w-full px-3 py-2 bg-muted border border-border border-dashed rounded-md text-sm text-center cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload JSON File</span>
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleFileUpload}
                disabled={uploadFile.isPending}
                data-testid="input-file-upload"
              />
            </label>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClearData}
              disabled={clearProjects.isPending}
              data-testid="button-clear-data"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {clearProjects.isPending ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
