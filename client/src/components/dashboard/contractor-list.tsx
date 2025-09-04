import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ArrowUpDown, Building, DollarSign, Info } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/analytics';

interface ContractorData {
  contractor: string;
  count: number;
  cost: number;
}

interface ContractorListProps {
  contractors: ContractorData[];
  title?: string;
  useFullCost?: boolean;
  onUseFullCostChange?: (checked: boolean) => void;
}

export function ContractorList({ 
  contractors, 
  title = "Top Contractors", 
  useFullCost = false,
  onUseFullCostChange 
}: ContractorListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'projects' | 'cost'>('projects');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const itemsPerPage = 10;

  // Sort contractors
  const sortedContractors = [...contractors].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'projects') {
      return (a.count - b.count) * multiplier;
    }
    return (a.cost - b.cost) * multiplier;
  });

  // Pagination
  const totalPages = Math.ceil(sortedContractors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContractors = sortedContractors.slice(startIndex, endIndex);

  const handleSort = (newSortBy: 'projects' | 'cost') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  return (
    <Card data-testid="contractor-list">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split('-') as ['projects' | 'cost', 'desc' | 'asc'];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-48" data-testid="contractor-sort-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="projects-desc">Most Projects</SelectItem>
                <SelectItem value="projects-asc">Fewest Projects</SelectItem>
                <SelectItem value="cost-desc">Highest Cost</SelectItem>
                <SelectItem value="cost-asc">Lowest Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {onUseFullCostChange && (
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox 
              id="use-full-cost"
              checked={useFullCost}
              onCheckedChange={onUseFullCostChange}
              data-testid="checkbox-use-full-cost"
            />
            <label 
              htmlFor="use-full-cost" 
              className="text-sm text-muted-foreground cursor-pointer flex items-center"
            >
              Use full project cost for joint ventures
              <Info className="ml-1 h-3 w-3" />
            </label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {currentContractors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">No contractors found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-6">Contractor Name</div>
              <div className="col-span-2 cursor-pointer flex items-center hover:text-foreground" 
                   onClick={() => handleSort('projects')}
                   data-testid="sort-projects">
                Projects
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </div>
              <div className="col-span-3 cursor-pointer flex items-center hover:text-foreground"
                   onClick={() => handleSort('cost')}
                   data-testid="sort-cost">
                Total Cost
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </div>
            </div>

            {/* Contractor Rows */}
            {currentContractors.map((contractor, index) => {
              const globalRank = startIndex + index + 1;
              return (
                <div key={contractor.contractor} 
                     className="grid grid-cols-12 gap-4 items-center py-2 hover:bg-muted/50 rounded-lg px-2"
                     data-testid={`contractor-row-${globalRank}`}>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {globalRank}
                  </div>
                  <div className="col-span-6">
                    <p className="font-medium text-sm truncate" title={contractor.contractor}>
                      {contractor.contractor}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center">
                      <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatNumber(contractor.count)}</span>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatCurrency(contractor.cost)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedContractors.length)} of {sortedContractors.length} contractors
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                data-testid="prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      data-testid={`page-${pageNum}`}
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                data-testid="next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}