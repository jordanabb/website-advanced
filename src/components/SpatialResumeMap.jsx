// src/components/SpatialResumeMap.jsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
// import gsap from 'gsap'; // You might not need gsap for this specific map animation
import resumeData from '../../data/spatial-data.json';
import './SpatialResumeMap.css'; // Ensure this CSS file exists and imports mapbox-gl.css
import MapFilters from './MapFilters';
import TimelineSlider from './TimelineSlider';

// Access token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Helper function to convert our data to GeoJSON FeatureCollection
function convertToGeoJSON(data) {
    // ... (keep your existing convertToGeoJSON function - it's good!)
    const features = data.map(item => {
        if (item.lon == null || item.lat == null) {
            console.warn(`Item with id ${item.id} missing coordinates.`);
            return null;
        }
        if (item.id == null) {
            console.warn(`Item missing id, required for interactions:`, item);
            return null;
        }
        // Ensure ID is suitable for feature-state (usually numbers or strings work)
        const featureId = typeof item.id === 'number' ? item.id : String(item.id);

        return {
            type: 'Feature',
            id: featureId, // CRITICAL: Use item.id as the feature ID
            geometry: {
                type: 'Point',
                coordinates: [item.lon, item.lat]
            },
            properties: { ...item }
        };
    }).filter(feature => feature !== null);

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
    { id: 'nodes-education', type: 'education', color: '#F0B917', strokeColor: null, radius: 5, hoverRadius: 7 },
    { id: 'nodes-project', type: 'project', color: 'transparent', strokeColor: '#58A6FF', strokeWidth: 1.5, radius: 5, hoverRadius: 7, hoverStrokeWidth: 2 },
    { id: 'nodes-publication', type: 'publication', color: '#58A6FF', strokeColor: null, radius: 4, hoverRadius: 6 },
    { id: 'nodes-conference', type: 'conference', color: 'transparent', strokeColor: '#F0B917', strokeWidth: 1.5, radius: 6, hoverRadius: 8, hoverStrokeWidth: 2 }
];


function SpatialResumeMap() {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    const [initialViewState] = useState({
        longitude: -98.5795,
        latitude: 39.8283,
        zoom: 3.5
    });

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [geojsonData, setGeojsonData] = useState(null);
    const popupRef = useRef(new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15 }));
    const hoveredStateIdRef = useRef(null); // Tracks the currently hovered feature ID

    // --- State for Filters and Timeline ---
    const { minYear, maxYear } = useMemo(() => {
        // ... (keep your existing minYear/maxYear calculation)
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
            // Ensure at least one filter is always active if needed, or adjust logic
            return next; // Allow empty state if desired
        });
    }, []);

    // --- REMOVED `applyFilters` function that used map.setFilter ---
    // We will now use feature-state updates in a useEffect hook

    // Effect to process data once
    useEffect(() => {
        console.log("Processing resume data into GeoJSON...");
        setGeojsonData(convertToGeoJSON(resumeData));
    }, []);


    // --- Effect for Map Initialization ---
    useEffect(() => {
        if (!geojsonData || !MAPBOX_TOKEN || mapRef.current) {
            console.log("Map initialization conditions not met or map already exists.");
            if (!geojsonData) console.log("Waiting for geojsonData...");
            if (!MAPBOX_TOKEN) console.log("Waiting for MAPBOX_TOKEN...");
            return;
        }

        console.log("Initializing Mapbox map...");
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom,
            renderWorldCopies: false,
        });
        mapRef.current = map;

        map.on('load', () => {
            console.log('Map loaded event fired. Applying styles, source, layers...');

            // --- Apply Custom Base Map Styling ---
            // ... (keep your existing base map styling logic)
            console.log('Applying custom base map styles...');
            // Land Styling
            ['land', 'national-park', 'landuse'].forEach(layerId => {if (map.getLayer(layerId)) {
                try {
                    map.setPaintProperty(layerId, 'fill-color', '#161B22');
                } catch (innerError) {
                    console.warn(`Failed to set fill-color for ${layerId}:`, innerError.message);
                }
            }});
            // Water Styling
            ['water', 'waterway', 'water-shadow'].forEach(layerId => {if (map.getLayer(layerId)) {
                try {
                   map.setPaintProperty(layerId, 'fill-color', '#0D1117');
                } catch (innerError) {
                    console.warn(`Failed to set fill-color for ${layerId}:`, innerError.message);
                }
           }});
            // Border Styling
            ['admin-1-boundary-bg', 'admin-0-boundary-bg', 'admin-1-boundary', 'admin-0-boundary', 'admin-0-boundary-disputed'].forEach(layerId => { if (map.getLayer(layerId)) {
                try {
                   map.setPaintProperty(layerId, 'line-color', '#30363D');
                   map.setPaintProperty(layerId, 'line-width', 0.5);
                   map.setPaintProperty(layerId, 'line-opacity', layerId.includes('-bg') ? 0 : 0.7);
                } catch (innerError) {
                    console.warn(`Failed to set paint props for border ${layerId}:`, innerError.message);
                }
           } });
            // Remove Labels, Icons, Roads, etc.
            map.getStyle().layers.forEach(layer => { if (!layer) return; // Basic safety check
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
                } });
            console.log('Custom base styles application attempt finished.');


            // --- Add Data Source ---
            if (!map.getSource('resume-points')) {
                map.addSource('resume-points', {
                    type: 'geojson',
                    data: geojsonData,
                    promoteId: 'id', // Keep this! It's needed for feature state on individual points.
                    cluster: true, // <<<--- Enable clustering
                    clusterMaxZoom: 14, // <<<--- Max zoom level where points cluster (adjust as needed)
                    clusterRadius: 50, // <<<--- Radius of each cluster cell on screen, in pixels (adjust as needed)
                    // Optional: Add properties to clusters (e.g., count per type) - more advanced
                    // clusterProperties: {
                    //    'education_count': ['+', ['case', ['==', ['get', 'type'], 'education'], 1, 0]],
                    //    'project_count': ['+', ['case', ['==', ['get', 'type'], 'project'], 1, 0]],
                    //    // ... etc for other types
                    // }
                });
                console.log('GeoJSON source added with clustering enabled: resume-points');
            }

                        // --- Add Cluster Layers ---
                        if (!map.getLayer('clusters')) {
                            map.addLayer({
                                id: 'clusters',
                                type: 'circle',
                                source: 'resume-points',
                                filter: ['has', 'point_count'], // Only apply to features created by clustering
                                paint: {
                                    // Use step expressions to style clusters based on point count
                                    'circle-color': [
                                        'step',
                                        ['get', 'point_count'],
                                        '#51bbd6', // Color for clusters with < 10 points
                                        10, '#f1f075', // Color for clusters with 10-29 points
                                        30, '#f28cb1'  // Color for clusters with >= 30 points
                                    ],
                                    'circle-radius': [
                                        'step',
                                        ['get', 'point_count'],
                                        18, // Pixel radius for clusters with < 10 points
                                        10, 22, // Radius for clusters with 10-29 points
                                        30, 28  // Radius for clusters with >= 30 points
                                    ],
                                    'circle-stroke-width': 1,
                                    'circle-stroke-color': '#fff' // Optional stroke
                                }
                            });
                            console.log('Cluster layer added: clusters');
                        }
            
                        if (!map.getLayer('cluster-count')) {
                            map.addLayer({
                                id: 'cluster-count',
                                type: 'symbol',
                                source: 'resume-points',
                                filter: ['has', 'point_count'], // Only apply to clustered features
                                layout: {
                                    'text-field': '{point_count_abbreviated}', // Shows the count (e.g., 1.2k)
                                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                                    'text-size': 12
                                },
                                paint: {
                                    'text-color': '#ffffff'
                                }
                            });
                            console.log('Cluster count layer added: cluster-count');
                        }
                        // --- Add Interaction for Clusters ---
                        map.on('click', 'clusters', (e) => {
                            const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                            if (!features.length) {
                                return;
                            }
                            const clusterId = features[0].properties.cluster_id;
                            const source = map.getSource('resume-points'); // Get the source object
            
                            // Ensure source has the getClusterExpansionZoom method (it should if cluster:true)
                            if (source && typeof source.getClusterExpansionZoom === 'function') {
                                source.getClusterExpansionZoom(
                                    clusterId,
                                    (err, zoom) => {
                                        if (err) {
                                            console.error("Error getting cluster expansion zoom:", err);
                                            return;
                                        }
            
                                        // Ease map view to the cluster's center and the calculated zoom level
                                        map.easeTo({
                                            center: features[0].geometry.coordinates,
                                            zoom: zoom + 0.5, // Add a little buffer to the zoom
                                            duration: 2500
                                        });
                                    }
                                );
                            } else {
                                 console.warn('Resume-points source or getClusterExpansionZoom method not available.');
                                 // Fallback: Maybe just zoom in one or two levels?
                                 map.easeTo({
                                     center: features[0].geometry.coordinates,
                                     zoom: map.getZoom() + 1.5,
                                     duration: 600
                                 });
                            }
                        });
            
                        // Optional: Change cursor on cluster hover
                        map.on('mouseenter', 'clusters', () => {
                            map.getCanvas().style.cursor = 'pointer';
                        });
                        map.on('mouseleave', 'clusters', () => {
                            map.getCanvas().style.cursor = '';
                        });

            // --- Add Layers & Interactions ---
            console.log('Adding data layers and event listeners...');
            nodeLayersConfig.forEach(layerConfig => {
                if (!map.getLayer(layerConfig.id)) {
                    map.addLayer({
                        id: layerConfig.id,
                        type: 'circle',
                        source: 'resume-points',
                        // **IMPORTANT: Filter only by TYPE here, visibility is handled by feature-state**
                        filter: ['==', ['get', 'type'], layerConfig.type],
                        paint: {
                            'circle-radius': [
                                'case',
                                ['boolean', ['feature-state', 'hover'], false],
                                layerConfig.hoverRadius ?? layerConfig.radius,
                                layerConfig.radius
                            ],
                            'circle-color': layerConfig.color,
                            'circle-stroke-color': layerConfig.strokeColor ?? 'transparent',
                            'circle-stroke-width': [
                                'case',
                                ['boolean', ['feature-state', 'hover'], false],
                                layerConfig.hoverStrokeWidth ?? layerConfig.strokeWidth ?? 0,
                                layerConfig.strokeWidth ?? 0
                            ],
                            'circle-radius-transition': { duration: 150 },
                            'circle-stroke-width-transition': { duration: 150 },
                        
                            // ✅ Use feature-state.opacity for smooth fading
                            'circle-opacity': [
  'interpolate',
  ['linear'],
  ['coalesce', ['feature-state', 'opacity'], 0],
  0, 0,
  1, 0.9
],
'circle-stroke-opacity': [
  'interpolate',
  ['linear'],
  ['coalesce', ['feature-state', 'opacity'], 0],
  0, 0,
  1, 0.9
]

                        }
                        
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

                } else {
                    console.log(`Layer ${layerConfig.id} already exists.`);
                }
            }); // end nodeLayersConfig.forEach

            // --- Set Initial Feature State (Important!) ---
            console.log('Setting initial feature states based on default filters/year...');
            if (geojsonData && geojsonData.features) {
                let countInitialActive = 0;
                geojsonData.features.forEach(feature => {
                    if (feature.id == null) return;

                    const properties = feature.properties;
                    const typeMatch = activeFilters.includes(properties.type);
                    const dateStr = properties.startDate || properties.date || '';
                    const year = parseInt(dateStr.substring(0, 4) || 'NaN', 10);
                    const dateMatch = !isNaN(year) && year <= currentYear;
                    const initiallyActive = typeMatch && dateMatch;

                    if (initiallyActive) { countInitialActive++; }

                    try {
                        // Initialize both 'active' and 'hover' states
                        map.setFeatureState(
                            { source: 'resume-points', id: feature.id },
                            {
                                active: initiallyActive,
                                hover: false,
                                opacity: initiallyActive ? 1 : 0 // Set opacity to 1 if active, 0 otherwise
                            }
                        );
                    } catch (e) {
                        // This can happen if the source/feature isn't fully ready, though less likely inside 'load'
                        console.warn(`Could not set initial state for feature ${feature.id}:`, e.message);
                    }
                });
                console.log(`Initial feature states set. ${countInitialActive} features initially active.`);
            } else {
                console.warn('GeoJSON data not available for initial state setting.');
            }
            // --- End Initial State Logic ---

            setIsMapLoaded(true); // Set loaded state AFTER layers & initial states
            console.log('Map is fully loaded and initial feature states applied.');

        }); // End map.on('load')

        map.on('error', (e) => { /* ... (your error handler) ... */ });

        // --- Cleanup ---
        return () => {
            if (mapRef.current) {
                console.log("Cleaning up map instance.");
                mapRef.current.remove();
                mapRef.current = null;
                setIsMapLoaded(false);
                hoveredStateIdRef.current = null;
                popupRef.current?.remove(); // Ensure popup is removed on unmount
            }
        };
    // Dependencies: Rerun ONLY if data changes or initial view state (rare)
    }, [geojsonData, initialViewState]);


    // --- NEW: Effect for Updating Feature States on Filter/Year Change ---
    useEffect(() => {
        const map = mapRef.current;
        if (!isMapLoaded || !map || !map.getSource('resume-points') || !geojsonData?.features) {
            return;
        }
    
        const FADE_DURATION = 1200; // ms
        const easing = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
        const fadeFeature = (featureId, from, to) => {
            let start = null;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / FADE_DURATION, 1);
                const value = from + (to - from) * easing(progress);
                map.setFeatureState({ source: 'resume-points', id: featureId }, { opacity: value });
                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
        };
    
        geojsonData.features.forEach((feature) => {
            if (feature.id == null) return;
    
            const props = feature.properties;
            const typeMatch = activeFilters.includes(props.type);
            const featureYear = parseInt((props.startDate || props.date || '').substring(0, 4), 10);
            const dateMatch = !isNaN(featureYear) && featureYear <= currentYear;
            const shouldBeActive = typeMatch && dateMatch;
    
            const id = feature.id;
            const featureId = { source: 'resume-points', id };
    
            const currentState = map.getFeatureState(featureId);
            const currentlyActive = !!currentState.active;
            const currentOpacity = currentState.opacity ?? 0;
    
            // Set new 'active' state
            map.setFeatureState(featureId, { active: shouldBeActive });
    
            // Only fade if state changed
            if (shouldBeActive && !currentlyActive) {
                fadeFeature(id, currentOpacity, 1);
            } else if (!shouldBeActive && currentlyActive) {
                fadeFeature(id, currentOpacity, 0);
            }
        });
    }, [isMapLoaded, activeFilters, currentYear, geojsonData]);
    
    
    
    // --- Render Component ---
    return (
        <div className="map-page-wrapper">
            <div ref={mapContainerRef} className="map-container"></div>

            {/* --- Controls Overlay --- */}
            <div className={`map-controls-overlay ${!filtersVisible ? 'collapsed' : ''}`}>
                 <button
                    className="toggle-button"
                    onClick={() => setFiltersVisible(v => !v)}
                 >
                    {filtersVisible ? 'Hide Controls ▼' : 'Show Controls ▲'}
                 </button>

                 <div className="collapsible-content">
                    {/* Render controls only when data is ready for them */}
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
                 </div>
            </div>

            {/* --- Loading/Error Indicators --- */}
            {!MAPBOX_TOKEN && <div className="map-overlay-message error">Error: Mapbox Token Missing.</div>}
            {/* Show loading only if token exists but map isn't ready */}
            {MAPBOX_TOKEN && !isMapLoaded && <div className="map-overlay-message loading">Loading Map...</div>}
        </div>
    );
}

export default SpatialResumeMap;