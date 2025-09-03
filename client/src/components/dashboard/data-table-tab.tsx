import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Download, FileCode, MapPin, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Project, SortField, SortDirection } from '@/types/project';
import { formatCurrency, formatNumber, sortProjects } from '@/lib/analytics';
import { downloadCSV, downloadJSON, exportToCSVFromAPI } from '@/lib/export';

interface DataTableTabProps {
  projects: Project[];
  isLoading: boolean;
  filters: any;
}

const ITEMS_PER_PAGE = 25;

export function DataTableTab({ projects, isLoading, filters }: DataTableTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('projectname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedProjects = sortProjects(projects, sortField, sortDirection);
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleExportCSV = () => {
    exportToCSVFromAPI(filters);
  };

  const handleExportJSON = () => {
    downloadJSON(sortedProjects);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    return (
      <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''} text-foreground`} />
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="data-table-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="data-table-tab">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">Project Data</h2>
          <Badge variant="secondary" data-testid="project-count">
            {formatNumber(projects.length)} projects
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportCSV} data-testid="button-export-csv">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON} data-testid="button-export-json">
            <FileCode className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('projectname')}
                  data-testid="header-project-name"
                >
                  Project Name {getSortIcon('projectname')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('location')}
                  data-testid="header-location"
                >
                  Location {getSortIcon('location')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('contractor')}
                  data-testid="header-contractor"
                >
                  Contractor {getSortIcon('contractor')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('cost')}
                  data-testid="header-cost"
                >
                  Cost {getSortIcon('cost')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('fy')}
                  data-testid="header-fiscal-year"
                >
                  Fiscal Year {getSortIcon('fy')}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((project) => (
                  <TableRow 
                    key={project.id} 
                    className="hover:bg-muted/30 transition-colors"
                    data-testid={`row-project-${project.id}`}
                  >
                    <TableCell>
                      <div className="font-medium text-foreground">{project.projectname}</div>
                      <div className="text-sm text-muted-foreground">Infrastructure Development</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground">{project.location}</div>
                      <div className="text-sm text-muted-foreground">{project.region}</div>
                    </TableCell>
                    <TableCell className="text-foreground">{project.contractor}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(parseFloat(project.cost))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {parseFloat(project.cost) > 1e9 ? 'High Value' : 'Standard'}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{project.fy}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="View on Map"
                          data-testid={`button-map-${project.id}`}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="View Details"
                          data-testid={`button-details-${project.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="Export"
                          onClick={() => downloadJSON([project], `project-${project.id}.json`)}
                          data-testid={`button-export-${project.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <div className="text-center">
                        <div className="text-lg mb-2">No projects found</div>
                        <p className="text-sm">Try adjusting your filters or upload some data</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {paginatedProjects.length > 0 && (
          <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground" data-testid="pagination-info">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedProjects.length)} of {formatNumber(sortedProjects.length)} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                data-testid="button-previous-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      data-testid="button-last-page"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
