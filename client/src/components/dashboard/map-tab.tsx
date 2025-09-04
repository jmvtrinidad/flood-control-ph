import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Crosshair, Expand, MapPin } from 'lucide-react';
import type { Project } from '@/types/project';

interface MapTabProps {
  projects: Project[];
  isLoading: boolean;
  selectedProject?: Project | null;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function MapTab({ projects, isLoading, selectedProject }: MapTabProps) {
  const [map, setMap] = useState<any>(null);
  const [currentSelectedProject, setCurrentSelectedProject] = useState<Project | null>(selectedProject || null);
  const [mapStyle, setMapStyle] = useState('roadmap');

  useEffect(() => {
    const initializeMap = () => {
      if (window.google && window.google.maps) {
        const mapOptions = {
          zoom: 6,
          center: { lat: 12.8797, lng: 121.7740 }, // Philippines center
          mapTypeId: mapStyle,
        };

        const mapInstance = new window.google.maps.Map(
          document.getElementById('map-container'),
          mapOptions
        );

        setMap(mapInstance);

        // Add markers for projects
        projects.forEach((project) => {
          const marker = new window.google.maps.Marker({
            position: { 
              lat: parseFloat(project.latitude), 
              lng: parseFloat(project.longitude) 
            },
            map: mapInstance,
            title: project.projectname,
            icon: selectedProject?.id === project.id ? {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                '<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M12 0C5.4 0 0 5.4 0 12s12 24 12 24 12-17.6 12-24S18.6 0 12 0z" fill="#FF4444"/>' +
                '<circle cx="12" cy="12" r="6" fill="white"/>' +
                '</svg>'
              ),
              scaledSize: new window.google.maps.Size(24, 36)
            } : undefined,
          });

          marker.addListener('click', () => {
            setCurrentSelectedProject(project);
          });
        });

        // Center on selected project if provided
        if (selectedProject && selectedProject.latitude && selectedProject.longitude) {
          const selectedLocation = {
            lat: parseFloat(selectedProject.latitude),
            lng: parseFloat(selectedProject.longitude)
          };
          mapInstance.setCenter(selectedLocation);
          mapInstance.setZoom(12);
          setCurrentSelectedProject(selectedProject);
        }
      }
    };

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
      
      if (apiKey) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.onload = initializeMap;
        document.head.appendChild(script);
      }
    } else {
      initializeMap();
    }
  }, [projects, mapStyle]);

  const handleStyleChange = (newStyle: string) => {
    setMapStyle(newStyle);
    if (map) {
      map.setMapTypeId(newStyle);
    }
  };

  const centerMap = () => {
    if (map) {
      map.setCenter({ lat: 12.8797, lng: 121.7740 });
      map.setZoom(6);
    }
  };

  const toggleFullscreen = () => {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapContainer.requestFullscreen();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="map-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="map-tab">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Project Locations</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" data-testid="button-toggle-layers">
            <Layers className="mr-2 h-4 w-4" />
            Toggle Layers
          </Button>
          <Button variant="outline" size="sm" onClick={centerMap} data-testid="button-center-map">
            <Crosshair className="mr-2 h-4 w-4" />
            Center Map
          </Button>
          <Button onClick={toggleFullscreen} data-testid="button-fullscreen">
            <Expand className="mr-2 h-4 w-4" />
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0 relative">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-10 space-y-2">
            <Card className="p-3 shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Map Style</label>
                <Select value={mapStyle} onValueChange={handleStyleChange}>
                  <SelectTrigger className="w-32" data-testid="select-map-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roadmap">Default</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

          {/* Map Legend */}
          <div className="absolute top-4 right-4 z-10">
            <Card className="p-3 shadow-sm max-w-xs">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Legend</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Active Projects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Completed Projects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Planned Projects</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Google Maps Container */}
          <div 
            id="map-container" 
            className="h-[600px] w-full"
            data-testid="map-container"
          >
            {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_MAPS_API_KEY && (
              <div className="flex items-center justify-center h-full bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <MapPin className="mx-auto h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Google Maps Integration</p>
                  <p className="text-sm">Please add your Google Maps API key to environment variables</p>
                  <p className="text-xs mt-2">VITE_GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Footer Info */}
          <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center justify-between text-sm">
            <div className="text-muted-foreground" data-testid="map-info">
              <span>{projects.length}</span> projects visible • 
              <span> {new Set(projects.map(p => p.region)).size}</span> regions
            </div>
            <div className="text-muted-foreground">
              <MapPin className="inline h-4 w-4 mr-1" />
              Click markers for details
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details Panel */}
      {currentSelectedProject && (
        <Card data-testid="project-details-panel">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>Project Details</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentSelectedProject(null)}
                data-testid="button-close-details"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">{currentSelectedProject.projectname}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-foreground">{currentSelectedProject.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contractor:</span>
                    <span className="text-foreground">{currentSelectedProject.contractor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-semibold text-foreground">
                      ₱{(parseFloat(currentSelectedProject.cost) / 1e9).toFixed(1)}B
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fiscal Year:</span>
                    <span className="text-foreground">{currentSelectedProject.fy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Region:</span>
                    <span className="text-foreground">{currentSelectedProject.region}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Project Timeline</h4>
                <div className="space-y-2 text-sm">
                  {currentSelectedProject.start_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="text-foreground">{currentSelectedProject.start_date}</span>
                    </div>
                  )}
                  {currentSelectedProject.completion_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completion Date:</span>
                      <span className="text-foreground">{currentSelectedProject.completion_date}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs">
                      {currentSelectedProject.status || 'Active'}
                    </span>
                  </div>
                </div>
                {currentSelectedProject.other_details && (
                  <div className="mt-4">
                    <h4 className="font-medium text-foreground mb-2">Additional Details</h4>
                    <p className="text-sm text-muted-foreground">{currentSelectedProject.other_details}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
