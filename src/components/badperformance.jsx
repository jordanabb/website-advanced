// src/components/SpatialResumeMap.jsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import resumeData from '../../data/spatial-data.json';
import './SpatialResumeMap.css';
import MapFilters from './MapFilters';
import TimelineSlider from './TimelineSlider';

// Access token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Animation duration constants
const FADE_DURATION = 500; // ms for fade animations

// Helper function to convert our data to GeoJSON FeatureCollection
function convertToGeoJSON(data) {
    const features = data.map(item => {
        if (item.lon == null || item.lat == null) {
            console.warn(`Item with id ${item.id} missing coordinates.`);
            return null;
        }
        if (item.id == null) {
            console.warn(`Item missing id, required for interactions:`, item);
            return null;
        }
        const featureId = typeof item.id === 'number' ? item.id : String(item.id);

        return {
            type: 'Feature',
            id: featureId,
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

// Layer Definitions
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
    const popupRef = useRef(new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15 }));
    const hoveredStateIdRef = useRef(null);
    const layerOpacityRef = useRef(0.9); // Start with full opacity
    const isFirstRenderRef = useRef(true);
    const previousFilteredDataRef = useRef(null);

    // Keep track of visible layers for selective filtering
    const stablePointsSourceRef = useRef(null);
    const transitionPointsSourceRef = useRef(null);

    const [initialViewState] = useState({
        longitude: -98.5795,
        latitude: 39.8283,
        zoom: 3.5
    });

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

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
    const [fullDataSet, setFullDataSet] = useState(convertToGeoJSON(resumeData));

    // --- Handlers ---
    const handleYearChange = useCallback((year) => {
        if (!isTransitioning) setCurrentYear(year);
    }, [isTransitioning]);
    
    const handleFilterChange = useCallback((type) => {
        if (isTransitioning) return;
        
        setActiveFilters(prev => {
            const next = prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type];
            return next.length > 0 ? next : prev;
        });
    }, [isTransitioning]);

    // --- Filtered Data Logic ---
    const filteredGeojsonData = useMemo(() => {
        console.log("Filtering data based on:", activeFilters, currentYear);
        const filteredData = resumeData.filter(item => {
            const typeMatch = activeFilters.includes(item.type);
            const dateStr = item.startDate || item.date || '';
            const year = parseInt(dateStr.substring(0, 4) || 'NaN', 10);
            const dateMatch = !isNaN(year) && year <= currentYear;
            return typeMatch && dateMatch;
        });
        console.log(`Filtered down to ${filteredData.length} items.`);
        return convertToGeoJSON(filteredData);
    }, [activeFilters, currentYear]);

    // --- Effect for Map Initialization ---
    useEffect(() => {
        if (!MAPBOX_TOKEN || mapRef.current) {
            if (!MAPBOX_TOKEN) console.log("Waiting for MAPBOX_TOKEN...");
            return;
        }

        console.log("Initializing Mapbox map...");
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/jordanabb/cm9n5p7g600cg01rz8drw4kx2',
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom,
            renderWorldCopies: false,
        });
        mapRef.current = map;

        map.on('load', () => {
            console.log('Map loaded. Adding sources and layers...');

            // --- Add Data Sources ---
            // Main data source for stable points
            map.addSource('resume-points', {
                type: 'geojson',
                data: filteredGeojsonData,
                promoteId: 'id',
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            });
            stablePointsSourceRef.current = 'resume-points';

            // Temporary source for transitioning points
            map.addSource('transition-points', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
                promoteId: 'id'
            });
            transitionPointsSourceRef.current = 'transition-points';

            // --- Add Cluster Layers for main source ---
            map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'resume-points',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#51bbd6', 10, '#f1f075', 30, '#f28cb1'
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        18, 10, 22, 30, 28
                    ],
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': layerOpacityRef.current,
                    'circle-opacity-transition': { duration: FADE_DURATION },
                }
            });

            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'resume-points',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                },
                paint: {
                    'text-color': '#ffffff',
                    'text-opacity': layerOpacityRef.current,
                    'text-opacity-transition': { duration: FADE_DURATION }
                }
            });

            // --- Add Individual Point Layers (stable) ---
            nodeLayersConfig.forEach(layerConfig => {
                // 1. Main layer from resume-points source
                map.addLayer({
                    id: layerConfig.id,
                    type: 'circle',
                    source: 'resume-points',
                    filter: [
                        'all',
                        ['!', ['has', 'point_count']], // Only show unclustered points
                        ['==', ['get', 'type'], layerConfig.type]
                    ],
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
                        'circle-opacity': layerOpacityRef.current,
                        'circle-stroke-opacity': layerOpacityRef.current,
                        'circle-radius-transition': { duration: 150 },
                        'circle-stroke-width-transition': { duration: 150 },
                        'circle-opacity-transition': { duration: FADE_DURATION },
                        'circle-stroke-opacity-transition': { duration: FADE_DURATION }
                    }
                });

                // 2. Transition layer from transition-points source (for fading in/out)
                map.addLayer({
                    id: `${layerConfig.id}-transition`,
                    type: 'circle',
                    source: 'transition-points',
                    filter: [
                        'all',
                        ['==', ['get', 'type'], layerConfig.type]
                    ],
                    paint: {
                        'circle-radius': layerConfig.radius,
                        'circle-color': layerConfig.color,
                        'circle-stroke-color': layerConfig.strokeColor ?? 'transparent',
                        'circle-stroke-width': layerConfig.strokeWidth ?? 0,
                        'circle-opacity': 0, // Start invisible
                        'circle-stroke-opacity': 0, // Start invisible
                        'circle-opacity-transition': { duration: FADE_DURATION },
                        'circle-stroke-opacity-transition': { duration: FADE_DURATION }
                    }
                });

                // --- Event Listeners for Hover (only on main layer) ---
                map.on('mouseenter', layerConfig.id, (e) => {
                    map.getCanvas().style.cursor = 'pointer';
                    const feature = e.features?.[0];
                    if (!feature || feature.id == null) return;

                    // Clear previous hover state
                    if (hoveredStateIdRef.current !== null && hoveredStateIdRef.current !== feature.id) {
                        try {
                            map.setFeatureState(
                                { source: 'resume-points', id: hoveredStateIdRef.current },
                                { hover: false }
                            );
                        } catch (error) {
                            console.warn(`Could not unset hover state for old feature:`, error.message);
                        }
                    }

                    // Set current hover state
                    hoveredStateIdRef.current = feature.id;
                    try {
                        map.setFeatureState(
                            { source: 'resume-points', id: hoveredStateIdRef.current },
                            { hover: true }
                        );
                    } catch (error) {
                        console.warn(`Could not set hover state for new feature:`, error.message);
                    }

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
                    if (popupRef.current && typeof popupRef.current.setLngLat === 'function') {
                        popupRef.current.setLngLat(coordinates).setHTML(description).addTo(map);
                    }
                });

                map.on('mouseleave', layerConfig.id, () => {
                    map.getCanvas().style.cursor = '';
                    popupRef.current?.remove();

                    // Clear hover state
                    if (hoveredStateIdRef.current !== null) {
                        try {
                            map.setFeatureState(
                                { source: 'resume-points', id: hoveredStateIdRef.current },
                                { hover: false }
                            );
                        } catch (error) {
                            console.warn(`Could not unset hover state on mouseleave:`, error.message);
                        }
                    }
                    hoveredStateIdRef.current = null;
                });

                // --- Click Listener (only on main layer) ---
                map.on('click', layerConfig.id, (e) => {
                    const feature = e.features?.[0];
                    if (feature?.properties) {
                        console.log("Node clicked:", feature.properties);
                    }
                });
            });

            // --- Add Interaction for Clusters (Zooming) ---
            map.on('click', 'clusters', (e) => {
                const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                if (!features.length) return;

                const clusterId = features[0].properties.cluster_id;
                const source = map.getSource('resume-points');

                if (source && typeof source.getClusterExpansionZoom === 'function') {
                    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                        if (err) {
                            console.error("Error getting cluster expansion zoom:", err);
                            return;
                        }
                        map.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom + 0.5,
                            duration: 1000
                        });
                    });
                } else {
                    console.warn('Resume-points source or getClusterExpansionZoom method not available.');
                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: map.getZoom() + 1.5,
                        duration: 600
                    });
                }
            });

            map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

            previousFilteredDataRef.current = filteredGeojsonData;
            setIsMapLoaded(true);
            console.log('Map is fully loaded and initial layers added.');
        });

        map.on('error', (e) => {
            console.error("Mapbox Error:", e);
        });

        // --- Cleanup ---
        return () => {
            if (mapRef.current) {
                console.log("Cleaning up map instance.");
                mapRef.current.remove();
                mapRef.current = null;
                setIsMapLoaded(false);
                hoveredStateIdRef.current = null;
                popupRef.current?.remove();
            }
        };
    }, [initialViewState]);

    // --- Effect for Individual Point Transitions ---
    useEffect(() => {
        const map = mapRef.current;
        if (!isMapLoaded || !map || !map.getSource('resume-points') || !map.getSource('transition-points')) {
            return;
        }

        // Skip animation on first render
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            // Just set initial data without animation
            const source = map.getSource('resume-points');
            if (source) {
                source.setData(filteredGeojsonData);
            }
            previousFilteredDataRef.current = filteredGeojsonData;
            return;
        }

        const updateWithIndividualPointTransitions = async () => {
            try {
                setIsTransitioning(true);
                
                // Get previous and current data
                const previousData = previousFilteredDataRef.current;
                const currentData = filteredGeojsonData;
                
                if (!previousData || !currentData) {
                    console.warn("Missing previous or current data for transition");
                    setIsTransitioning(false);
                    return;
                }
                
                // Find points that are being added or removed
                const previousIds = new Set(previousData.features.map(f => f.id));
                const currentIds = new Set(currentData.features.map(f => f.id));
                
                // Find points being added (in current but not in previous)
                const addedPoints = currentData.features.filter(f => !previousIds.has(f.id));
                
                // Find points being removed (in previous but not in current)
                const removedPoints = previousData.features.filter(f => !currentIds.has(f.id));
                
                // No changes? Just update the source directly without animations
                if (addedPoints.length === 0 && removedPoints.length === 0) {
                    const source = map.getSource('resume-points');
                    if (source) {
                        source.setData(filteredGeojsonData);
                    }
                    previousFilteredDataRef.current = filteredGeojsonData;
                    setIsTransitioning(false);
                    return;
                }
                
                console.log(`Transitioning ${addedPoints.length} points in, ${removedPoints.length} points out`);
                
                // Start with current stable points (excluding points being added)
                const stablePoints = {
                    type: 'FeatureCollection',
                    features: currentData.features.filter(f => 
                        !addedPoints.some(added => added.id === f.id)
                    )
                };
                
                // Update the main source with stable points
                const stableSource = map.getSource('resume-points');
                if (stableSource) {
                    stableSource.setData(stablePoints);
                }
                
                // Phase 1: Handle removed points with fade out
                if (removedPoints.length > 0) {
                    // Set transition source with points to be removed
                    const transitionSource = map.getSource('transition-points');
                    if (transitionSource) {
                        transitionSource.setData({
                            type: 'FeatureCollection',
                            features: removedPoints
                        });
                    }
                    
                    // Show those points at full opacity
                    nodeLayersConfig.forEach(layerConfig => {
                        const layerId = `${layerConfig.id}-transition`;
                        map.setPaintProperty(layerId, 'circle-opacity', layerOpacityRef.current);
                        map.setPaintProperty(layerId, 'circle-stroke-opacity', layerOpacityRef.current);
                    });
                    
                    // Short delay to ensure rendering
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Fade them out
                    nodeLayersConfig.forEach(layerConfig => {
                        const layerId = `${layerConfig.id}-transition`;
                        map.setPaintProperty(layerId, 'circle-opacity', 0);
                        map.setPaintProperty(layerId, 'circle-stroke-opacity', 0);
                    });
                    
                    // Wait for fade out to complete
                    await new Promise(resolve => setTimeout(resolve, FADE_DURATION));
                }
                
                // Phase 2: Handle added points with fade in
                if (addedPoints.length > 0) {
                    // Set transition source with points to be added
                    const transitionSource2 = map.getSource('transition-points');
                    if (transitionSource2) {
                        transitionSource2.setData({
                            type: 'FeatureCollection',
                            features: addedPoints
                        });
                    }
                    
                    // Make sure they start invisible
                    nodeLayersConfig.forEach(layerConfig => {
                        const layerId = `${layerConfig.id}-transition`;
                        map.setPaintProperty(layerId, 'circle-opacity', 0);
                        map.setPaintProperty(layerId, 'circle-stroke-opacity', 0);
                    });
                    
                    // Short delay to ensure rendering
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Fade them in
                    nodeLayersConfig.forEach(layerConfig => {
                        const layerId = `${layerConfig.id}-transition`;
                        map.setPaintProperty(layerId, 'circle-opacity', layerOpacityRef.current);
                        map.setPaintProperty(layerId, 'circle-stroke-opacity', layerOpacityRef.current);
                    });
                    
                    // Wait for fade in to complete
                    await new Promise(resolve => setTimeout(resolve, FADE_DURATION));
                    
                    // After fade in, update main source with all current points
                    const mainSource = map.getSource('resume-points');
                    if (mainSource) {
                        mainSource.setData(currentData);
                    }
                    
                    // Clear transition source
                    const transitionSource = map.getSource('transition-points');
                    if (transitionSource) {
                        transitionSource.setData({
                            type: 'FeatureCollection',
                            features: []
                        });
                    }
                }
                
                // Update our reference to current data
                previousFilteredDataRef.current = currentData;
                setIsTransitioning(false);
                console.log("Individual point transitions complete");
                
            } catch (error) {
                console.error("Error during transition:", error);
                // Fallback to direct update in case of error
                const source = map.getSource('resume-points');
                if (source) {
                    source.setData(filteredGeojsonData);
                }
                previousFilteredDataRef.current = filteredGeojsonData;
                setIsTransitioning(false);
            }
        };

        updateWithIndividualPointTransitions();

    }, [isMapLoaded, filteredGeojsonData]);

    return (
        <div className="map-page-wrapper">
            <div ref={mapContainerRef} className="map-container"></div>

            {/* --- Controls Overlay --- */}
            <div className={`map-controls-overlay ${!filtersVisible ? 'collapsed' : ''}`}>
                <button
                    className="toggle-button"
                    onClick={() => setFiltersVisible(v => !v)}
                    disabled={isTransitioning}
                >
                    {filtersVisible ? 'Hide Controls ▼' : 'Show Controls ▲'}
                </button>

                <div className="collapsible-content">
                    {minYear !== Infinity && maxYear !== -Infinity && (
                        <>
                            <MapFilters
                                activeFilters={activeFilters}
                                onFilterChange={handleFilterChange}
                                disabled={isTransitioning}
                            />
                            <TimelineSlider
                                minYear={minYear}
                                maxYear={maxYear}
                                currentYear={currentYear}
                                onYearChange={handleYearChange}
                                disabled={isTransitioning}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SpatialResumeMap;