import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Crosshair, Expand, MapPin, Star, ThumbsUp, AlertTriangle, Ghost, MapPin as LocationIcon, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAddReaction, useProjectReactions, useUserProjectReaction } from '@/hooks/useReactions';
import { useAuth } from '@/hooks/useAuth';
import type { Project } from '@/types/project';
import { formatCurrency } from '@/lib/analytics';

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
  const [showAllProjects, setShowAllProjects] = useState(!selectedProject);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null);
  const [projectCircles, setProjectCircles] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const addReaction = useAddReaction();
  const { data: reactions = [] } = useProjectReactions(currentSelectedProject?.id || '');

  // Component for rating buttons with current user rating highlighted
  const ProjectRatingButtons = ({ projectId }: { projectId: string }) => {
    const userReaction = useUserProjectReaction(projectId, user?.id);
    const currentRating = userReaction?.rating;

    const ratings = [
      { key: 'excellent', label: 'Excellent', icon: Star },
      { key: 'standard', label: 'Standard', icon: ThumbsUp },
      { key: 'sub-standard', label: 'Sub-standard', icon: AlertTriangle },
      { key: 'ghost', label: 'Ghost Project', icon: Ghost }
    ];

    return (
      <div className="grid grid-cols-2 gap-2">
        {ratings.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={currentRating === key ? "default" : "outline"}
            size="sm"
            onClick={() => handleReactionClick(key)}
            disabled={addReaction.isPending}
            className={`justify-start ${currentRating === key ? getRatingColor(key) : getRatingColor(key)}`}
            data-testid={`button-rate-${key.replace('-', '')}`}
          >
            <Icon className="mr-2 h-4 w-4" fill={key === 'excellent' ? 'currentColor' : 'none'} />
            {label}
          </Button>
        ))}
      </div>
    );
  };

  // Update showAllProjects state when selectedProject changes
  useEffect(() => {
    setShowAllProjects(!selectedProject);
  }, [selectedProject]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast({
            title: "Location captured",
            description: "Your location has been captured for proximity verification."
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location access denied",
            description: "Please allow location access for proximity verification.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
    }
  };

  // Toggle current location display
  const toggleCurrentLocation = () => {
    if (!showCurrentLocation && !userLocation) {
      getCurrentLocation();
    }
    setShowCurrentLocation(!showCurrentLocation);
  };

  // Calculate distance between two points in kilometers
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
             Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
             Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleReactionClick = async (rating: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rate projects.",
        variant: "destructive"
      });
      return;
    }

    if (!currentSelectedProject) return;

    try {
      await addReaction.mutateAsync({
        projectId: currentSelectedProject.id,
        rating,
        userLocation: userLocation || undefined
      });
      
      toast({
        title: "Rating submitted",
        description: userLocation ? "Your rating has been submitted with location verification." : "Your rating has been submitted."
      });
    } catch (error) {
      toast({
        title: "Failed to submit rating",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />;
      case 'standard':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'sub-standard':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'ghost':
        return <Ghost className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      case 'standard':
        return 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100';
      case 'sub-standard':
        return 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100';
      case 'ghost':
        return 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

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

        // Filter projects to display based on mode
        const projectsToDisplay = showAllProjects ? projects : (selectedProject ? [selectedProject] : []);
        
        // Clear existing circles
        projectCircles.forEach(circle => circle.setMap(null));
        setProjectCircles([]);
        
        // Add markers for projects
        const newCircles: any[] = [];
        projectsToDisplay.forEach((project) => {
          const projectLat = parseFloat(project.latitude);
          const projectLng = parseFloat(project.longitude);
          
          // Determine marker color based on proximity to user location (500m for rating eligibility)
          let canRate = false;
          if (userLocation && showCurrentLocation) {
            const distance = calculateDistance(userLocation.latitude, userLocation.longitude, projectLat, projectLng);
            canRate = distance <= 0.5; // 500 meters
          }
          
          // Create marker with appropriate color
          const markerColor = selectedProject?.id === project.id ? '#FF4444' :
                             canRate ? '#22C55E' : // Green for can rate
                             showCurrentLocation ? '#EF4444' : '#3B82F6'; // Red for can't rate, blue for default
          
          const marker = new window.google.maps.Marker({
            position: { lat: projectLat, lng: projectLng },
            map: mapInstance,
            title: project.projectname,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                '<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M12 0C5.4 0 0 5.4 0 12s12 24 12 24 12-17.6 12-24S18.6 0 12 0z" fill="' + markerColor + '"/>' +
                '<circle cx="12" cy="12" r="6" fill="white"/>' +
                '</svg>'
              ),
              scaledSize: new window.google.maps.Size(24, 36)
            },
          });

          marker.addListener('click', () => {
            setCurrentSelectedProject(project);
          });
          
          // Add 10km radius circle when location is shown
          if (showCurrentLocation && userLocation) {
            const circle = new window.google.maps.Circle({
              strokeColor: canRate ? '#22C55E' : '#EF4444',
              strokeOpacity: 0.6,
              strokeWeight: 2,
              fillColor: canRate ? '#22C55E' : '#EF4444',
              fillOpacity: 0.1,
              map: mapInstance,
              center: { lat: projectLat, lng: projectLng },
              radius: 10000, // 10km in meters
            });
            newCircles.push(circle);
          }
        });
        
        setProjectCircles(newCircles);
        
        // Add user location marker if enabled
        if (userLocationMarker) {
          userLocationMarker.setMap(null);
          setUserLocationMarker(null);
        }
        
        if (showCurrentLocation && userLocation) {
          const userMarker = new window.google.maps.Marker({
            position: { lat: userLocation.latitude, lng: userLocation.longitude },
            map: mapInstance,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>' +
                '<circle cx="10" cy="10" r="3" fill="white"/>' +
                '</svg>'
              ),
              scaledSize: new window.google.maps.Size(20, 20)
            },
          });
          setUserLocationMarker(userMarker);
        }

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
  }, [projects, mapStyle, showAllProjects, selectedProject, showCurrentLocation, userLocation]);

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

  const projectsToDisplay = showAllProjects ? projects : (selectedProject ? [selectedProject] : []);

  return (
    <div className="p-6 space-y-6" data-testid="map-tab">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">Project Locations</h2>
          {selectedProject && (
            <div className="flex items-center space-x-2">
              <Button 
                variant={showAllProjects ? "outline" : "default"}
                size="sm"
                onClick={() => setShowAllProjects(false)}
                data-testid="button-show-selected"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Show Selected Only
              </Button>
              <Button 
                variant={showAllProjects ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllProjects(true)}
                data-testid="button-show-all"
              >
                Show All Projects
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={showCurrentLocation ? "default" : "outline"} 
            size="sm" 
            onClick={toggleCurrentLocation}
            data-testid="button-toggle-location"
          >
            <Navigation className="mr-2 h-4 w-4" />
            {showCurrentLocation ? 'Hide' : 'Show'} Location
          </Button>
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
                  {showCurrentLocation ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Can Rate (Within 500m)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Cannot Rate (Beyond 500m)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Your Location</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 border border-green-500 rounded-full bg-green-100"></div>
                        <span className="text-xs text-muted-foreground">10km Radius</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Infrastructure Projects</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Selected Project</span>
                      </div>
                    </>
                  )}
                </div>
                {showCurrentLocation && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Green pins: You can rate these projects (within 500m)
                    </p>
                  </div>
                )}
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
              <span>{projectsToDisplay.length}</span> projects visible • 
              <span> {new Set(projectsToDisplay.map(p => p.region)).size}</span> regions
              {selectedProject && !showAllProjects && (
                <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  Filtered View
                </span>
              )}
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
                      {formatCurrency(parseFloat(currentSelectedProject.cost))}
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
              
              {/* Rating Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-foreground">Rate this Project</h4>
                  {!userLocation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      className="text-xs"
                      data-testid="button-get-location"
                    >
                      <LocationIcon className="mr-1 h-3 w-3" />
                      Get Location
                    </Button>
                  )}
                </div>
                
                <ProjectRatingButtons projectId={currentSelectedProject.id} />
                
                {userLocation && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center">
                    <LocationIcon className="mr-1 h-3 w-3" />
                    Location captured for proximity verification
                  </p>
                )}
                
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Please sign in to rate projects
                  </p>
                )}
                
                {/* Show existing reactions count */}
                {reactions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      {reactions.length} reaction{reactions.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {['excellent', 'standard', 'sub-standard', 'ghost'].map(rating => {
                        const count = reactions.filter(r => r.rating === rating).length;
                        if (count === 0) return null;
                        return (
                          <div key={rating} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getRatingColor(rating)}`}>
                            {getRatingIcon(rating)}
                            <span>{count}</span>
                          </div>
                        );
                      })}
                    </div>
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
