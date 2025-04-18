// src/components/SpatialResumeMap.jsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import gsap from 'gsap';
import resumeData from '../../data/spatial-data.json';
import './SpatialResumeMap.css'; // Ensure this CSS file exists and imports mapbox-gl.css
import MapFilters from './MapFilters'; 
import TimelineSlider from './TimelineSlider';


// Access token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Helper function to convert our data to GeoJSON FeatureCollection
function convertToGeoJSON(data) {
  const features = data.map(item => {
    // Basic validation
    if (item.lon == null || item.lat == null) {
      console.warn(`Item with id ${item.id} missing coordinates.`);
      return null; // Skip items without coordinates
    }
    // Ensure ID is present and suitable for feature-state
    if (item.id == null) {
        console.warn(`Item missing id, which is required for interactions:`, item);
        return null;
    }
    return {
      type: 'Feature',
      // IMPORTANT: Use item.id as the feature ID for feature-state
      id: item.id,
      geometry: {
        type: 'Point',
        coordinates: [item.lon, item.lat] // GeoJSON format: [longitude, latitude]
      },
      properties: { ...item } // Pass all original properties
    };
  }).filter(feature => feature !== null); // Remove any null features

  return {
    type: 'FeatureCollection',
    features: features
  };
}

// --- Layer Definitions (Constants outside component) ---
const nodeLayerIds = [
    'nodes-education', 'nodes-project', 'nodes-publication', 'nodes-conference'
];
const nodeLayersConfig = [
    // Radius: Normal=5, Hover=7 | StrokeWidth: Normal=0, Hover=0
    { id: 'nodes-education', type: 'education', color: '#F0B917', strokeColor: null, radius: 5, hoverRadius: 7 },
    // Radius: Normal=5, Hover=7 | StrokeWidth: Normal=1.5, Hover=2
    { id: 'nodes-project', type: 'project', color: 'transparent', strokeColor: '#58A6FF', strokeWidth: 1.5, radius: 5, hoverRadius: 7, hoverStrokeWidth: 2 },
    // Radius: Normal=4, Hover=6 | StrokeWidth: Normal=0, Hover=0
    { id: 'nodes-publication', type: 'publication', color: '#58A6FF', strokeColor: null, radius: 4, hoverRadius: 6 },
    // Radius: Normal=6, Hover=8 | StrokeWidth: Normal=1.5, Hover=2
    { id: 'nodes-conference', type: 'conference', color: 'transparent', strokeColor: '#F0B917', strokeWidth: 1.5, radius: 6, hoverRadius: 8, hoverStrokeWidth: 2 }
];


function SpatialResumeMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Initial map view state (using useState ensures stable references)
  const [initialViewState] = useState({
      longitude: -98.5795,
      latitude: 39.8283,
      zoom: 3.5
  });

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [geojsonData, setGeojsonData] = useState(null);
  const popupRef = useRef(new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15 }));
  const hoveredStateIdRef = useRef(null);

  // --- State for Filters and Timeline ---
  const { minYear, maxYear } = useMemo(() => {
    let min = Infinity; let max = -Infinity;
    resumeData.forEach(item => {
      const yearStr = (item.startDate || item.date || '');
      const year = parseInt(yearStr?.substring(0, 4) || 'NaN', 10);
      if (!isNaN(year)) { min = Math.min(min, year); max = Math.max(max, year); }
    });
    const currentActualYear = new Date().getFullYear();
    return {
        minYear: min === Infinity ? 2010 : min,
        maxYear: max === -Infinity ? currentActualYear : Math.max(max, currentActualYear)
    };
  }, []);

  const [currentYear, setCurrentYear] = useState(maxYear);
  const [activeFilters, setActiveFilters] = useState(['education', 'project', 'publication', 'conference']);
  const [filtersVisible, setFiltersVisible] = useState(true);

  // --- Handlers ---
  const handleYearChange = useCallback((year) => setCurrentYear(year), []);
  const handleFilterChange = useCallback((type) => {
    setActiveFilters(prev => {
      const next = prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type];
      return next.length > 0 ? next : prev; // Keep at least one active
    });
  }, []);

  // --- Filtering Function (Memoized) ---
  // --- Filtering Function (Memoized) ---
  const applyFilters = useCallback((map, filters, year) => {
    if (!map || !map.isStyleLoaded()) return;

    // Define the filter expression with correct structure and types
    const mapFilter = [
        'all', // Combine conditions with AND

        // Condition 1: Type Check
        ['in',
            ['get', 'type'],
            ['literal', filters]
        ],

        // Condition 2: Date check

        ['<=',
            ['to-number', ['slice', ['coalesce', ['get', 'startDate'], ['get', 'date']], 0, 4]],
            year
          ]
    
    ];

    // Apply the filter
    nodeLayerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            try { map.setFilter(layerId, mapFilter); }
            catch (e) { console.error(`Error setting filter for ${layerId}:`, e); }
        }
    });
  }, []); // End of useCallback

  // Effect to process data once
  useEffect(() => {
    setGeojsonData(convertToGeoJSON(resumeData));
  }, []);

 // src/components/SpatialResumeMap.jsx

// ... (Imports: React, useState, useRef, useEffect, useCallback, useMemo, mapboxgl, gsap, resumeData, CSS, components)
// ... (Component definition: SpatialResumeMap() )
// ... (State variables: initialViewState, isMapLoaded, geojsonData, popupRef, hoveredStateIdRef, minYear, maxYear, currentYear, activeFilters, filtersVisible, isPanelOpen, selectedFeatureData, panelRef)
// ... (Handlers: handleYearChange, handleFilterChange, closePanel - closePanel might be defined later or passed in)
// ... (Layer configs: nodeLayerIds, nodeLayersConfig)


// --- Effect for Map Initialization ---
useEffect(() => {
    // Exit if data or token isn't ready
    if (!geojsonData || !MAPBOX_TOKEN) {
      console.log("Map initialization waiting for data or token.");
      return;
    }
  
    // Initialize map only once
    if (!mapRef.current) {
      console.log("Initializing Mapbox map...");
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Or your custom style
        center: [initialViewState.longitude, initialViewState.latitude],
        zoom: initialViewState.zoom,
        renderWorldCopies: false,
        // Add any other map options here
      });
      mapRef.current = map; // Store map instance
  
      // --- Map Load Event Listener ---
      map.on('load', () => {
        console.log('Map loaded event fired. Applying styles, source, layers...');
  
        // --- Apply Custom Base Map Styling ---
            // --- Apply Custom Base Map Styling (More Robust) ---
console.log('Applying custom base map styles...');
// Land Styling
['land', 'national-park', 'landuse'].forEach(layerId => {
    if (map.getLayer(layerId)) {
        try {
            map.setPaintProperty(layerId, 'fill-color', '#161B22');
        } catch (innerError) {
            console.warn(`Failed to set fill-color for ${layerId}:`, innerError.message);
        }
    }
});
// Water Styling
['water', 'waterway', 'water-shadow'].forEach(layerId => {
     if (map.getLayer(layerId)) {
         try {
            map.setPaintProperty(layerId, 'fill-color', '#0D1117');
         } catch (innerError) {
             console.warn(`Failed to set fill-color for ${layerId}:`, innerError.message);
         }
    }
});
// Border Styling
['admin-1-boundary-bg', 'admin-0-boundary-bg', 'admin-1-boundary', 'admin-0-boundary', 'admin-0-boundary-disputed'].forEach(layerId => {
    if (map.getLayer(layerId)) {
         try {
            map.setPaintProperty(layerId, 'line-color', '#30363D');
            map.setPaintProperty(layerId, 'line-width', 0.5);
            map.setPaintProperty(layerId, 'line-opacity', layerId.includes('-bg') ? 0 : 0.7);
         } catch (innerError) {
             console.warn(`Failed to set paint props for border ${layerId}:`, innerError.message);
         }
    }
});
// Remove Labels, Icons, Roads, etc.
// Use try-catch within the loop to prevent one failure from stopping others
map.getStyle().layers.forEach(layer => {
    if (!layer) return; // Basic safety check
    if (layer.type === 'symbol' || layer.id.includes('road') || layer.id.includes('bridge') || layer.id.includes('tunnel') || layer.id.includes('railway') || layer.id.includes('transit') || layer.id.includes('aeroway') || layer.id === 'building') {
        try {
            // Double-check layer exists *just before* modifying it
            if (map.getLayer(layer.id)) {
                map.setLayoutProperty(layer.id, 'visibility', 'none');
            }
        } catch (innerError) {
             // Log warnings but allow the loop to continue
             // Avoid logging common "layer does not exist" errors if style is changing rapidly
             if (!innerError.message || !innerError.message.includes('does not exist')) {
                console.warn(`Failed to hide layer ${layer.id}:`, innerError.message);
             }
        }
    }
});
console.log('Custom base styles application attempt finished.');
// --- End Robust Styling Block ---
      
  
        // --- Add Data Source ---
        if (!map.getSource('resume-points')) {
          map.addSource('resume-points', {
            type: 'geojson',
            data: geojsonData,
            promoteId: 'id' // <<<--- CRITICAL: Ensure this is present
          });
          console.log('GeoJSON source added: resume-points');
        } else {
           console.log('Source resume-points already exists.');
        }
  
        // --- Add Layers & Interactions ---
        console.log('Adding data layers and event listeners...');
        nodeLayersConfig.forEach(layerConfig => {
          if (!map.getLayer(layerConfig.id)) {
            map.addLayer({
              id: layerConfig.id,
              type: 'circle',
              source: 'resume-points',
              paint: {
                // Hover state logic for radius/stroke
                'circle-radius': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false], layerConfig.hoverRadius ?? layerConfig.radius,
                  layerConfig.radius
                ],
                'circle-color': layerConfig.color,
                'circle-stroke-color': layerConfig.strokeColor ?? 'transparent',
                'circle-stroke-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false], layerConfig.hoverStrokeWidth ?? layerConfig.strokeWidth ?? 0,
                    layerConfig.strokeWidth ?? 0
                ],
  
                // Control Opacity via 'active' state
                'circle-opacity': [
                  'case',
                  ['!', ['boolean', ['feature-state', 'active'], true]], 0, // If active is explicitly false, opacity 0
                  0.9 // Default visible opacity
                ],
                'circle-stroke-opacity': [ // Also fade stroke
                  'case',
                  ['!', ['boolean', ['feature-state', 'active'], true]], 0,
                  0.9 // Default visible stroke opacity
                ],
  
                // Add Transitions
                'circle-opacity-transition': { duration: 300, delay: 0 },
                'circle-stroke-opacity-transition': { duration: 300, delay: 0 },
                'circle-radius-transition': { duration: 150 },
                'circle-stroke-width-transition': { duration: 150 },
              }
              // No 'filter' property here for visibility control
            });
            console.log(`Layer added: ${layerConfig.id}`);
  
            // --- Event Listeners (Uncommented and Functional) ---
            map.on('mouseenter', layerConfig.id, (e) => {
              map.getCanvas().style.cursor = 'pointer';
              const feature = e.features?.[0];
              if (!feature || feature.id == null) return;
  
              // Clear hover state from previous feature ONLY if it's different
              if (hoveredStateIdRef.current !== null && hoveredStateIdRef.current !== feature.id) {
                try {
                  if (map.getSource('resume-points') && map.getFeatureState({ source: 'resume-points', id: hoveredStateIdRef.current }) !== null) {
                    map.setFeatureState( { source: 'resume-points', id: hoveredStateIdRef.current }, { hover: false } );
                  }
                } catch (error) { console.warn(`Could not unset hover state for old feature ${hoveredStateIdRef.current}:`, error.message); }
              }
  
              // Set hover state for the current feature
              hoveredStateIdRef.current = feature.id;
              try {
                 if (map.getSource('resume-points') && map.querySourceFeatures('resume-points', { filter: ['==', 'id', feature.id] }).length > 0) {
                   map.setFeatureState( { source: 'resume-points', id: hoveredStateIdRef.current }, { hover: true } ); // Triggers radius/stroke animation
                 }
              } catch (error) { console.warn(`Could not set hover state for new feature ${hoveredStateIdRef.current}:`, error.message); }
  
              // --- Popup ---
              const coordinates = feature.geometry.coordinates.slice();
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
              const properties = feature.properties || {};
              const description = `
                <strong>${properties.title || 'No Title'}</strong><br>
                Type: ${properties.type || 'N/A'}<br>
                Location: ${properties.location || 'N/A'}
                ${properties.startDate ? `<br>Date: ${properties.startDate}` : ''}
                ${properties.date && !properties.startDate ? `<br>Date: ${properties.date}` : ''}
              `;
               // Ensure popup is created and has setLngLat method
               if (popupRef.current && typeof popupRef.current.setLngLat === 'function') {
                  popupRef.current.setLngLat(coordinates).setHTML(description).addTo(map);
               } else {
                  console.error("Popup reference is not correctly initialized.");
               }
            });
  
            map.on('mouseleave', layerConfig.id, () => {
              map.getCanvas().style.cursor = '';
              popupRef.current.remove(); // Remove popup
  
              // Clear hover state if the ref still holds an ID
              if (hoveredStateIdRef.current !== null) {
                try {
                   if (map.getSource('resume-points') && map.getFeatureState({ source: 'resume-points', id: hoveredStateIdRef.current }) !== null) {
                     map.setFeatureState( { source: 'resume-points', id: hoveredStateIdRef.current }, { hover: false } ); // Triggers revert animation
                   }
                } catch (error) { console.warn(`Could not unset hover state on mouseleave for ${hoveredStateIdRef.current}:`, error.message); }
              }
              hoveredStateIdRef.current = null; // Clear the ref
            });
  
            // --- Click Listener (Placeholder for Panel Trigger) ---
            // Note: The full implementation including panel animation trigger
            // belongs in a separate useEffect hook added in Step 5's instructions.
            // This basic listener can remain for initial setup/debugging.
            const basicClickHandler = (e) => {
              const feature = e.features?.[0];
              if (feature?.properties) {
                  console.log("Node clicked (basic listener):", feature.properties);
                  // Later, this logic moves to a dedicated effect to handle panel state/animation
              }
            };
            map.on('click', layerConfig.id, basicClickHandler);
            // --- End Event Listeners ---
  
          } else { // end if (!map.getLayer(layerConfig.id))
              console.log(`Layer ${layerConfig.id} already exists.`);
          }
        }); // end nodeLayersConfig.forEach
        console.log('Layers configuration and basic event listeners added.');
  
        // --- Set Initial Feature State ---
        console.log('Setting initial feature states based on default filters/year...');
        if (geojsonData && geojsonData.features) {
            let countInitialActive = 0;
            geojsonData.features.forEach(feature => {
                if (feature.id == null) return;
  
                // Determine initial visibility based on component's starting state vars
                const typeMatch = activeFilters.includes(feature.properties.type);
                const dateStr = feature.properties.startDate || feature.properties.date || '';
                const year = parseInt(dateStr.substring(0, 4) || 'NaN', 10);
                const dateMatch = !isNaN(year) && year <= currentYear;
                const initiallyActive = typeMatch && dateMatch;
  
                if (initiallyActive) { countInitialActive++; }
  
                try {
                    // Initialize 'active' state. Also explicitly set 'hover' to false.
                    map.setFeatureState(
                        { source: 'resume-points', id: feature.id },
                        { active: initiallyActive, hover: false }
                    );
                } catch (e) {
                     console.warn(`Could not set initial state for feature ${feature.id}:`, e.message);
                }
            });
            console.log(`Initial feature states set. ${countInitialActive} features initially active.`);
        } else {
             console.warn('GeoJSON data not available for initial state setting.');
        }
        // --- End Initial State Logic ---
  
        // *** Set loaded state AFTER layers and initial states are applied ***
        setIsMapLoaded(true);
        console.log('Map is fully loaded and initial feature states applied.');
  
      }); // End map.on('load')
  
      // --- Error Handling ---
      map.on('error', (e) => {
        // Ignore background layer errors which sometimes happen on style changes/map remove
        if (e?.error?.message?.includes("layer 'background' does not exist")) { return; }
        console.error("Mapbox error:", e);
        if (e.error) { console.error("Mapbox error detail:", e.error); }
      });
  
    } // End of map initialization block (!mapRef.current)
  
    // --- Cleanup Function ---
    // This runs when the component unmounts or dependencies change forcing re-initialization
    return () => {
      if (mapRef.current) {
        console.log("Cleaning up map instance.");
        mapRef.current.remove(); // Clean up the map instance
        mapRef.current = null;   // Clear the ref
        setIsMapLoaded(false);   // Reset loaded state
        hoveredStateIdRef.current = null; // Clear hover ref
      }
    };
  
  // Dependencies for INITIALIZATION: Only re-run if data or initial view changes.
  // Filter/year state changes should NOT trigger this whole hook again.
  }, [geojsonData, initialViewState]); // Dependency Array
  
  // ... (The REST of your component: state, other useEffects for animation, handlers, render method) ...


  // --- Effect for Applying Filters on State Change ---
  useEffect(() => {
    const map = mapRef.current;
    // Apply filters only AFTER map is loaded AND if filters/year change
    if (map && isMapLoaded) {
      // console.log("Filter state changed, reapplying filters..."); // Debug if needed
      applyFilters(map, activeFilters, currentYear);
    }
  // Dependencies for FILTERING only: loaded status, filter/year state, and the filter function reference
  }, [isMapLoaded, activeFilters, currentYear, applyFilters]);


  // --- Render Component ---
  return (
    <div className="map-page-wrapper">
        <div ref={mapContainerRef} className="map-container"></div>

        {/* --- Apply conditional class for styling/transitions --- */}
        <div className={`map-controls-overlay ${!filtersVisible ? 'collapsed' : ''}`}>
            {/* Keep the button always visible */}
            <button
                className="toggle-button"
                onClick={() => setFiltersVisible(v => !v)}
            >
                {/* Use more descriptive icons or text */}
                {filtersVisible ? 'Hide Filters ▼' : 'Show Filters ▲'}
            </button>

            {/* Conditionally render or style the content */}
            {/* Option 1: Conditional Rendering (simple show/hide) */}
            {/* {filtersVisible && (
                <>
                    {geojsonData && minYear !== Infinity && maxYear !== -Infinity && (
                        <>
                            <MapFilters
                                activeFilters={activeFilters}
                                onFilterChange={handleFilterChange}
                            />
                            <TimelineSlider
                                minYear={minYear}
                                maxYear={maxYear}
                                currentYear={currentYear}
                                onYearChange={handleYearChange}
                            />
                        </>
                    )}
                </>
            )} */}

            {/* Option 2: CSS Transitions (smoother, requires CSS adjustments) */}
            {/* Wrap the content that needs to collapse */}
            <div className="collapsible-content">
                 {/* Render controls only when data is ready, but allow CSS to hide them */}
                 {geojsonData && minYear !== Infinity && maxYear !== -Infinity && (
                    <>
                        {/* You could add a title here that also hides */}
                        {/* <h3>Map Controls</h3> */}
                        <MapFilters
                            activeFilters={activeFilters}
                            onFilterChange={handleFilterChange}
                        />
                        <TimelineSlider
                            minYear={minYear}
                            maxYear={maxYear}
                            currentYear={currentYear}
                            onYearChange={handleYearChange}
                        />
                    </>
                 )}
            </div>


        </div>

        {/* Optional Loading/Error indicators */}
        {!MAPBOX_TOKEN && <div className="map-overlay-message error">Error: Mapbox Token Missing.</div>}
        {MAPBOX_TOKEN && !isMapLoaded && <div className="map-overlay-message loading">Loading Map...</div>}
    </div>
  );
}

export default SpatialResumeMap;