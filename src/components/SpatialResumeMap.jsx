// src/components/SpatialResumeMap.jsx
// --- Final Version with working hover, no-blur glow, and feature-state fade-in ---

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl'; // mapbox-gl installed
import debounce from 'lodash.debounce'; // lodash.debounce installed
import resumeData from '../../data/spatial-data.json'; // ADJUST PATH if needed

// Import your actual components and CSS
import MapFilters from './MapFilters';          // ADJUST PATH if needed
import TimelineSlider from './TimelineSlider';    // ADJUST PATH if needed
import './SpatialResumeMap.css';             // Your component's CSS file
import ContextualPanel from './ContextualPanel/ContextualPanel';
import Icon from './ui/Icon/Icon'; // Import Icon for navigation buttons
import Button from './ui/Button/Button'; // <<< ADDED: Import Button component

// Ensure Mapbox CSS is loaded globally (e.g., in index.html or main App component)

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
    console.error("Mapbox token is not set. Please set VITE_MAPBOX_TOKEN environment variable.");
}

// Map style URLs for different themes
const MAP_STYLES = {
    dark: 'mapbox://styles/jordanabb/cm9n5p7g600cg01rz8drw4kx2', // Existing dark mode style
    light: 'mapbox://styles/jordanabb/cmb5puoou002f01qt4r796okw' // New light mode style
};

// Animation duration constants
const FADE_DURATION = 500; // ms for fade animations
const GLOW_TRANSITION_DURATION = 150; // ms for glow appearing/disappearing smoothly
const DEBOUNCE_DELAY = 300; // ms to wait after scrubbing before updating

// Helper function to convert our data to GeoJSON FeatureCollection
function convertToGeoJSON(data) {
    const features = data.map(item => {
        if (item.lon == null || item.lat == null) {
            // console.warn(`Item with id ${item.id || '(missing ID)'} missing coordinates.`);
            return null;
        }
        if (item.id == null) {
            console.warn(`Item missing id, required for interactions:`, item);
            return null;
        }
        const featureId = typeof item.id === 'number' ? item.id : String(item.id);
        let coordinates = [item.lon, item.lat];
        // Apply jittering to the coordinates
        coordinates = jitterCoordinates(coordinates);
        return { type: 'Feature', id: featureId, geometry: { type: 'Point', coordinates: coordinates }, properties: { ...item } };
    }).filter(feature => feature !== null);
    return { type: 'FeatureCollection', features: features };
}

// Function to add a small random jitter to coordinates
function jitterCoordinates(coordinates, amount = 0.05) {
    const lng = coordinates[0] + (Math.random() - 0.5) * amount;
    const lat = coordinates[1] + (Math.random() - 0.5) * amount;
    return [lng, lat];
}

// Layer Definitions - NO BLUR
const nodeLayersConfig = [
    { id: 'nodes-education', type: 'education', color: '#F0B917', radius: 5, hoverRadius: 7, glowColor: '#F0B917', glowRadius: 9, glowBlur: 0, glowOpacity: 0, hoverGlowOpacity: 0.5, },
    { id: 'nodes-work', type: 'work', color: '#3FB950', radius: 5, hoverRadius: 7, glowColor: '#3FB950', glowRadius: 10, glowBlur: 0, glowOpacity: 0, hoverGlowOpacity: 0.5, },
    { id: 'nodes-publication', type: 'publication', color: '#58A6FF', radius: 4, hoverRadius: 6, glowColor: '#58A6FF', glowRadius: 9, glowBlur: 0, glowOpacity: 0, hoverGlowOpacity: 0.5, },
    { id: 'nodes-conference', type: 'conference', color: 'transparent', strokeColor: '#A371F7', strokeWidth: 1.5, radius: 6, hoverRadius: 8, hoverStrokeWidth: 2, glowColor: '#A371F7', glowRadius: 11, glowBlur: 0, glowOpacity: 0, hoverGlowOpacity: 0.5, }
];

// --- Component Start ---
function SpatialResumeMap() {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const popupRef = useRef(null);
    const hoveredStateIdRef = useRef(null);
    const selectedNodeIdRef = useRef(null); // Track selected node ID for click comparison
    const layerOpacityRef = useRef(1.0);
    const previousFilteredDataRef = useRef(null);
    const sliderValueRef = useRef(null);
    const stateClearTimeoutIdRef = useRef(null); // Ref for fade-in cleanup timeout

    const [initialViewState] = useState({ longitude: -98.5795, latitude: 39.8283, zoom: 3.0 });
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [selectedNodeData, setSelectedNodeData] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(-1); // Index of selected node in filtered list
    const [currentTheme, setCurrentTheme] = useState('dark'); // Track current theme

    // Function to detect current theme from body classes
    const detectCurrentTheme = useCallback(() => {
        const body = document.body;
        if (body.classList.contains('light-mode')) {
            return 'light';
        } else {
            return 'dark'; // Default to dark
        }
    }, []);

    // Function to add all layers and sources to the map
    const addMapLayers = useCallback((map, currentFilteredData) => {
        // 1. Add Source (initially empty, promoteId needed for feature state)
        map.addSource('resume-points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'id', cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });

        // 2. Add Cluster Layers (Rendered underneath node layers)
        map.addLayer({ id: 'clusters', type: 'circle', source: 'resume-points', filter: ['has', 'point_count'], paint: { 'circle-color': ['step',['get','point_count'],'#51bbd6',10,'#f1f075',30,'#f28cb1'], 'circle-radius': ['step',['get','point_count'],18,10,22,30,28], 'circle-stroke-width': 1, 'circle-stroke-color': '#fff', 'circle-opacity': layerOpacityRef.current, 'circle-opacity-transition': { duration: FADE_DURATION } } });
        map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'resume-points', filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['DIN Offc Pro Medium','Arial Unicode MS Bold'], 'text-size': 12, 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': '#fff', 'text-opacity': layerOpacityRef.current, 'text-opacity-transition': { duration: FADE_DURATION } } });

        // 3. Add Node Layers (Main + Glow) and Interactions
        nodeLayersConfig.forEach(lc => { // Use 'lc' for layerConfig
            const commonFilter = ['all', ['!', ['has', 'point_count']], ['==', ['get', 'type'], lc.type]];
            const mainId = lc.id; const glowId = `${lc.id}-glow`;

            // Add MAIN Layer
            map.addLayer({ id: mainId, type: 'circle', source: 'resume-points', filter: commonFilter, paint: {
                'circle-radius': ['case',['boolean',['feature-state','hover'],false], lc.hoverRadius ?? lc.radius, lc.radius],
                'circle-color': lc.color,
                'circle-stroke-color': lc.strokeColor ?? 'transparent',
                'circle-stroke-width': ['case',['boolean',['feature-state','hover'],false], lc.hoverStrokeWidth ?? lc.strokeWidth ?? 0, lc.strokeWidth ?? 0],
                'circle-opacity': ['case',['boolean',['feature-state','fade-in'],false], 0, layerOpacityRef.current], // Handle fade-in
                'circle-stroke-opacity': ['case',['boolean',['feature-state','fade-in'],false], 0, layerOpacityRef.current], // Handle fade-in
                'circle-radius-transition': {duration:150},
                'circle-stroke-width-transition': {duration:150},
                'circle-opacity-transition': {duration:FADE_DURATION},
                'circle-stroke-opacity-transition': {duration:FADE_DURATION} }
            });

            // Add GLOW Layer (No Blur) BEFORE Main Layer
            map.addLayer({ id: glowId, type: 'circle', source: 'resume-points', filter: commonFilter, paint: {
                'circle-radius': lc.glowRadius,
                'circle-color': lc.glowColor,
                'circle-blur': lc.glowBlur, // Should be 0
                'circle-opacity': ['case',['boolean',['feature-state','fade-in'],false], 0, // Handle fade-in
                                     ['boolean',['feature-state','hover'],false], lc.hoverGlowOpacity, // Handle hover
                                     lc.glowOpacity], // Default (0)
                'circle-opacity-transition': {duration:Math.max(FADE_DURATION, GLOW_TRANSITION_DURATION)} }
            }, mainId); // Add before main layer

            // Setup Interactions for the MAIN layer
            map.on('mousemove', mainId, e => { if(isTransitioning) return; if(e.features?.length > 0){ const currentId=e.features[0].id; if(hoveredStateIdRef.current !== currentId){ if(hoveredStateIdRef.current !== null) try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:false});}catch(e){} hoveredStateIdRef.current=currentId; try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:true});}catch(e){}}} else { if(hoveredStateIdRef.current !== null) try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:false}); hoveredStateIdRef.current=null;}catch(e){} }});
            map.on('mouseleave', mainId, () => { if(isTransitioning) return; if(hoveredStateIdRef.current !== null) try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:false}); hoveredStateIdRef.current=null;}catch(e){} popupRef.current?.remove(); map.getCanvas().style.cursor=''; });
            map.on('mouseenter', mainId, e => { if(isTransitioning) return; map.getCanvas().style.cursor='pointer'; const f=e.features?.[0]; if(!f?.geometry?.coordinates || !f?.properties) return; const co=f.geometry.coordinates.slice(); while(Math.abs(e.lngLat.lng-co[0])>180){co[0]+=e.lngLat.lng>co[0]?360:-360;} const p=f.properties; const d=`<strong>${p.title||'Untitled'}</strong><br>Type: ${p.type||'N/A'}<br>Loc: ${p.location||'N/A'}${p.startDate?`<br>Start: ${p.startDate}`:''}${p.endDate && p.endDate !== "Present" ?`<br>End: ${p.endDate}`:''}${p.endDate === "Present" ? `<br>Ongoing`:''}${p.date&&!p.startDate?`<br>Date: ${p.date}`:''}`; if(popupRef.current?.setLngLat){popupRef.current.setLngLat(co).setHTML(d).addTo(map);} });
            // Inside map.once('load', ...) -> nodeLayersConfig.forEach(...)
map.on('click', mainId, (e) => {
    const feature = e.features?.[0];
    if (feature?.properties) {
        const clickedId = feature.id; // Use feature.id which is promoted
        
        // Check if the same icon is clicked again - if so, close the panel
        if (selectedNodeIdRef.current === clickedId) {
            console.log(`Same node clicked again: ID=${clickedId}, closing panel`);
            setSelectedNodeData(null);
            setSelectedIndex(-1);
            selectedNodeIdRef.current = null;
            return;
        }
        
        // Get current filtered data from the map source or use the current state
        let currentFeatures = [];
        try {
            const mapSource = map.getSource('resume-points');
            if (mapSource && mapSource._data && mapSource._data.features) {
                currentFeatures = mapSource._data.features;
            }
        } catch (e) {
            // Fallback to using the current filtered data state
            currentFeatures = filteredGeojsonData.features || [];
        }
        
        const index = currentFeatures.findIndex(f => f.id === clickedId);

        console.log(`Node clicked: ID=${clickedId}, Index=${index}`); // Log which node and its index

        if (index !== -1) {
            // Get the complete data from the original source to ensure all properties are included
            const originalData = resumeData.find(item => item.id === clickedId);
            setSelectedNodeData(originalData || feature.properties);
            setSelectedIndex(index);
            selectedNodeIdRef.current = clickedId; // Update ref with selected ID
        } else {
            // Even if not found in current features, still show the panel with the clicked data
            console.warn(`Clicked feature ID ${clickedId} not found in current features, but showing panel anyway.`);
            const originalData = resumeData.find(item => item.id === clickedId);
            setSelectedNodeData(originalData || feature.properties);
            setSelectedIndex(0); // Set to 0 as fallback
            selectedNodeIdRef.current = clickedId; // Update ref with selected ID
        }
    } else {
        setSelectedNodeData(null);
        setSelectedIndex(-1);
    }
});
        });
        map.on('click', (e) => {
            // Check if the click originated on one of your node layers
            const nodeLayerIds = nodeLayersConfig.map(lc => lc.id);
            const features = map.queryRenderedFeatures(e.point, { layers: nodeLayerIds });
        
            // If the click was NOT on one of your nodes (i.e., on the map background)
            if (!features.length) {
                 console.log("Map background clicked, closing panel.");
                 setSelectedNodeData(null);
                 setSelectedIndex(-1); // Reset index when closing panel
                 selectedNodeIdRef.current = null; // Clear ref
            }
            // If click WAS on a node, the layer-specific handler above already ran/will run
        });

        // Setup Cluster Interactions
        map.on('click', 'clusters', e => { if(isTransitioning) return; const f=map.queryRenderedFeatures(e.point,{layers:['clusters']}); if(!f.length) return; const cId=f[0].properties.cluster_id; const src=map.getSource('resume-points'); if(src?.getClusterExpansionZoom){src.getClusterExpansionZoom(cId,(err,zoom)=>{ if(err)return; map.easeTo({center:f[0].geometry.coordinates,zoom:Math.min(zoom+0.5,map.getMaxZoom()),duration:2500}); });}else{map.easeTo({center:f[0].geometry.coordinates,zoom:Math.min(map.getZoom()+1.5,map.getMaxZoom()),duration:600});} });
        map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor='pointer');
        map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor='');

        // 4. Add Permanent Icons (Home & Hometown)
        // Add source for permanent icons
        map.addSource('permanent-icons', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 'home-dc',
                        geometry: {
                            type: 'Point',
                            coordinates: [-77.0369, 38.9072] // Washington DC
                        },
                        properties: {
                            type: 'home',
                            title: 'Home',
                            location: 'Washington, DC',
                            icon: 'home'
                        }
                    },
                    {
                        type: 'Feature',
                        id: 'hometown-pgh',
                        geometry: {
                            type: 'Point',
                            coordinates: [-79.9959, 40.4406] // Pittsburgh
                        },
                        properties: {
                            type: 'hometown',
                            title: 'Hometown',
                            location: 'Pittsburgh, PA',
                            icon: 'star'
                        }
                    }
                ]
            }
        });

        // Add home circle layer
        map.addLayer({
            id: 'home-circle',
            type: 'circle',
            source: 'permanent-icons',
            filter: ['==', ['get', 'type'], 'home'],
            paint: {
                'circle-radius': 8,
                'circle-color': '#58A6FF',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.9,
                'circle-stroke-opacity': 1
            }
        });

        // Add home text layer
        map.addLayer({
            id: 'home-text',
            type: 'symbol',
            source: 'permanent-icons',
            filter: ['==', ['get', 'type'], 'home'],
            layout: {
                'text-field': '🏠',
                'text-size': 16,
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: {
                'text-color': '#ffffff',
                'text-opacity': 1
            }
        });

        // Add hometown circle layer
        map.addLayer({
            id: 'hometown-circle',
            type: 'circle',
            source: 'permanent-icons',
            filter: ['==', ['get', 'type'], 'hometown'],
            paint: {
                'circle-radius': 8,
                'circle-color': '#F0B917',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.9,
                'circle-stroke-opacity': 1
            }
        });

        // Add hometown text layer
        map.addLayer({
            id: 'hometown-text',
            type: 'symbol',
            source: 'permanent-icons',
            filter: ['==', ['get', 'type'], 'hometown'],
            layout: {
                'text-field': '⭐',
                'text-size': 16,
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            paint: {
                'text-color': '#ffffff',
                'text-opacity': 1
            }
        });

        // Add hover interactions for permanent icons
        map.on('mouseenter', 'home-circle', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = '<strong>Home</strong><br>Washington, DC';
            if (popupRef.current?.setLngLat) {
                popupRef.current.setLngLat(coordinates).setHTML(description).addTo(map);
            }
        });

        map.on('mouseleave', 'home-circle', () => {
            map.getCanvas().style.cursor = '';
            popupRef.current?.remove();
        });

        map.on('mouseenter', 'hometown-circle', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = '<strong>Hometown</strong><br>Pittsburgh, PA';
            if (popupRef.current?.setLngLat) {
                popupRef.current.setLngLat(coordinates).setHTML(description).addTo(map);
            }
        });

        map.on('mouseleave', 'hometown-circle', () => {
            map.getCanvas().style.cursor = '';
            popupRef.current?.remove();
        });
    }, [isTransitioning]);

    // Initialize Popup ref safely after mount
    useEffect(() => {
        popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15 });
    }, []);

    // Effect to listen for theme changes and update map style
    useEffect(() => {
        // Set initial theme
        const initialTheme = detectCurrentTheme();
        setCurrentTheme(initialTheme);

        // Function to handle theme changes
        const handleThemeChange = (event) => {
            const newTheme = event.detail.theme;
            console.log(`Theme changed to: ${newTheme}`);
            setCurrentTheme(newTheme);

            // Update map style if map is loaded
            if (mapRef.current && isMapLoaded) {
                const newStyleUrl = MAP_STYLES[newTheme];
                if (newStyleUrl) {
                    console.log(`Updating map style to: ${newStyleUrl}`);
                    
                    // Store current data before style change
                    const currentData = mapRef.current.getSource('resume-points')?._data;
                    
                    // Listen for style load to re-add layers and data
                    const handleStyleLoad = () => {
                        console.log('New style loaded, re-adding layers and data...');
                        addMapLayers(mapRef.current);
                        
                        // Restore data
                        if (currentData) {
                            const source = mapRef.current.getSource('resume-points');
                            if (source) {
                                source.setData(currentData);
                            }
                        }
                        
                        mapRef.current.off('styledata', handleStyleLoad);
                    };
                    
                    mapRef.current.on('styledata', handleStyleLoad);
                    mapRef.current.setStyle(newStyleUrl);
                }
            }
        };

        // Listen for theme change events
        document.addEventListener('themeChanged', handleThemeChange);

        // Cleanup
        return () => {
            document.removeEventListener('themeChanged', handleThemeChange);
        };
    }, [isMapLoaded]);

    // Calculate date range from data
    const { minYear, maxYear } = useMemo(() => {
        let min = Infinity; let max = -Infinity;
        resumeData.forEach(item => {
          const yearStr = (item.startDate || item.date || '');
          const yearMatch = yearStr.match(/^(\d{4})/);
          const year = yearMatch ? parseInt(yearMatch[1], 10) : NaN;
          if (!isNaN(year)) { min = Math.min(min, year); max = Math.max(max, year); }
        });
        const currentActualYear = new Date().getFullYear();
        return { minYear: min === Infinity ? 2010 : min, maxYear: max === -Infinity ? currentActualYear : Math.max(max, currentActualYear) };
    }, []);

    // State for filters and timeline control
    const [currentYear, setCurrentYear] = useState(maxYear); // Year used for filtering data
    const [displayYear, setDisplayYear] = useState(maxYear); // Year displayed on slider (updates instantly)
    const [activeFilters, setActiveFilters] = useState(['education', 'work', 'publication', 'conference']); // Currently active type filters
    const [filtersVisible, setFiltersVisible] = useState(true); // UI state for controls panel
    const [isSliderDragging, setIsSliderDragging] = useState(false);

    // Debounced function to update the actual filter year state
    const debouncedYearChange = useCallback(debounce((year) => {
        setCurrentYear(prevYear => (year !== prevYear ? year : prevYear)); // Update state only if year changed
        setIsSliderDragging(false);
    }, DEBOUNCE_DELAY), []); // Memoize debounced function

    // Event handlers for timeline slider
    const handleSliderDragStart = useCallback(() => { setIsSliderDragging(true); debouncedYearChange.cancel(); }, [debouncedYearChange]);
    const handleSliderChange = useCallback((year) => { if (isTransitioning) return; sliderValueRef.current = year; setDisplayYear(year); debouncedYearChange(year); }, [isTransitioning, debouncedYearChange]);
    const handleSliderDragEnd = useCallback(() => { if (sliderValueRef.current !== null) debouncedYearChange.flush(); }, [debouncedYearChange]);
    useEffect(() => () => debouncedYearChange.cancel(), [debouncedYearChange]); // Cleanup debounce on unmount

    // Event handler for filter button clicks
    const handleFilterChange = useCallback((type) => { if (isTransitioning) return; setActiveFilters(prev => prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]); }, [isTransitioning]);

    // Calculate GeoJSON data for the initial map view
    const initialFilteredGeojsonData = useMemo(() => {
        const initialActiveFilters = ['education', 'work', 'publication', 'conference']; const initialYear = maxYear;
        const filteredData = resumeData.filter(item => { const typeMatch = initialActiveFilters.includes(item.type); const dateStr = item.startDate || item.date || ''; const yearMatch = dateStr.match(/^(\d{4})/); const year = yearMatch ? parseInt(yearMatch[1], 10) : NaN; const dateMatch = !isNaN(year) && year <= initialYear; return typeMatch && dateMatch; });
        return convertToGeoJSON(filteredData);
     }, [maxYear]); // Depends only on maxYear

    // Calculate GeoJSON data based on current interactive state (filters/timeline)
    const filteredGeojsonData = useMemo(() => {
        if (activeFilters.length === 0) return convertToGeoJSON([]); // Handle case with no filters selected
        const filteredData = resumeData.filter(item => { const typeMatch = activeFilters.includes(item.type); const dateStr = item.startDate || item.date || ''; const yearMatch = dateStr.match(/^(\d{4})/); const year = yearMatch ? parseInt(yearMatch[1], 10) : NaN; const dateMatch = !isNaN(year) && year <= currentYear; return typeMatch && dateMatch; });
        
        // Sort chronologically (most recent first) for consistent navigation
        const sortedData = filteredData.sort((a, b) => {
            const yearA = parseInt((a.startDate || a.date || '').match(/^(\d{4})/)?.[1] || '0');
            const yearB = parseInt((b.startDate || b.date || '').match(/^(\d{4})/)?.[1] || '0');
            return yearB - yearA; // Most recent first
        });
        
        return convertToGeoJSON(sortedData);
    }, [activeFilters, currentYear]);

    // --- Effect for Map Initialization ---
    useEffect(() => {
        if (!MAPBOX_TOKEN || mapRef.current || !mapContainerRef.current) return; // Initialize only once

        console.log("Initializing Mapbox map...");
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        // Use the correct initial theme for map creation
        const initialTheme = detectCurrentTheme();
        const initialStyleUrl = MAP_STYLES[initialTheme];
        
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: initialStyleUrl, // Use theme-appropriate style
            center: [initialViewState.longitude, initialViewState.latitude], zoom: initialViewState.zoom,
            renderWorldCopies: false, antialias: true,
        });
        mapRef.current = map;

        map.once('load', () => {
            console.log('Map loaded. Adding source, layers...');
            addMapLayers(map);

            // 5. Set Initial Data
            const source = map.getSource('resume-points');
            if (source) source.setData(initialFilteredGeojsonData);
            previousFilteredDataRef.current = JSON.stringify(initialFilteredGeojsonData);
            setIsMapLoaded(true);
            console.log('Map loaded, layers added, initial data set.');
        }); // End map.once('load')

        map.on('error', e => console.error("Mapbox Error:", e.error?.message || e));
        return () => { if (mapRef.current) { console.log("Cleaning up map."); popupRef.current?.remove(); mapRef.current.remove(); mapRef.current = null; setIsMapLoaded(false); hoveredStateIdRef.current = null; if(stateClearTimeoutIdRef.current) clearTimeout(stateClearTimeoutIdRef.current); } }; // Cleanup timeout too
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialViewState, initialFilteredGeojsonData]); // Init effect

    // --- Effect for Selective Data Updates (REVISED Fade Logic) ---
    useEffect(() => {
        const map = mapRef.current;
        if (!isMapLoaded || !map || !map.getSource('resume-points') || isSliderDragging) return;

        const updateSourceSelectively = async () => { // Async function for await
            if (!map?.getStyle()) return; // Map might be removed during async

            const newFeaturesToClearState = [];
            let localStateClearTimeoutId = null; // Use local var for timeout

            try {
                const currentDataString = JSON.stringify(filteredGeojsonData);
                const previousDataString = previousFilteredDataRef.current;
                if (currentDataString === previousDataString) return;

                // console.log("Starting selective update (Feature State Fade-In)...");
                setIsTransitioning(true);

                const currentData = filteredGeojsonData.features;
                const previousData = JSON.parse(previousDataString || '{"features":[]}').features;
                const mainSource = map.getSource('resume-points');
                if (!mainSource?.setData) throw new Error("Main source invalid");

                let tempSource = map.getSource('temp-animation-source');
                if (!tempSource) { map.addSource('temp-animation-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'id' }); tempSource = map.getSource('temp-animation-source'); }
                if (!tempSource?.setData) throw new Error("Temp source invalid");

                const currentIds = new Set(currentData.map(f => f.id));
                const previousIds = new Set(previousData.map(f => f.id));
                const newFeatures = currentData.filter(f => !previousIds.has(f.id));
                const removedFeatures = previousData.filter(f => !currentIds.has(f.id));

                // console.log(`Animating Update: Adding ${newFeatures.length} (Fade In), Removing ${removedFeatures.length} (Fade Out)`);
                const layersToRemove = [];

                // --- Step 1: Fade Out Removed Features ---
                if (removedFeatures.length > 0) {
                    tempSource.setData({ type: 'FeatureCollection', features: removedFeatures });
                    const types = new Set(removedFeatures.map(f => f.properties.type));
                    types.forEach(type => {
                        const lc = nodeLayersConfig.find(c => c.type === type); if (!lc) return;
                        const ts = Date.now(); const mainFOId = `fadeout-${lc.id}-${ts}`; const glowFOId = `fadeout-${lc.id}-glow-${ts}`;
                        layersToRemove.push(mainFOId, glowFOId);
                        // Add MAIN fade out layer
                        map.addLayer({ id: mainFOId, type: 'circle', source: 'temp-animation-source', filter: ['==',['get','type'],type], paint: { 'circle-radius': lc.radius, 'circle-color': lc.color, 'circle-stroke-color': lc.strokeColor??'transparent', 'circle-stroke-width': lc.strokeWidth??0, 'circle-opacity': layerOpacityRef.current, 'circle-stroke-opacity': layerOpacityRef.current, 'circle-opacity-transition': {duration: FADE_DURATION}, 'circle-stroke-opacity-transition': {duration: FADE_DURATION} } });
                        // Add GLOW fade out layer BEFORE main fade out layer
                        map.addLayer({ id: glowFOId, type: 'circle', source: 'temp-animation-source', filter: ['==',['get','type'],type], paint: { 'circle-radius': lc.glowRadius, 'circle-color': lc.glowColor, 'circle-blur': lc.glowBlur, 'circle-opacity': 0, 'circle-opacity-transition': {duration: FADE_DURATION} } }, mainFOId);
                    });
                    await new Promise(r => setTimeout(r, 20));
                    // Trigger fade out transition
                    layersToRemove.forEach(id => { if(map.getLayer(id)){ map.setPaintProperty(id,'circle-opacity',0); if(!id.includes('-glow') && map.getPaintProperty(id,'circle-stroke-opacity')!==undefined) map.setPaintProperty(id,'circle-stroke-opacity',0); }});
                }

                // --- Step 2: Update Main Source Data ---
                mainSource.setData(filteredGeojsonData);
                previousFilteredDataRef.current = currentDataString;
                // console.log("Main source updated.");

                // --- Step 3: Trigger Fade-In for New Features ---
                if (newFeatures.length > 0) {
                    // console.log(`Setting 'fade-in' state for ${newFeatures.length} features.`);
                    newFeatures.forEach(f => { if(f.id!=null){ try{ map.setFeatureState({source:'resume-points',id:f.id},{'fade-in':true}); newFeaturesToClearState.push(f.id); }catch(e){} }});
                    await new Promise(r => setTimeout(r, 50)); // Short delay seems needed

                    // console.log(`Scheduling 'fade-in' state removal in ${FADE_DURATION}ms.`);
                    localStateClearTimeoutId = setTimeout(() => {
                        const currentMap = mapRef.current; // Re-get the map ref inside the timeout
                        if (!currentMap || !currentMap.isStyleLoaded() || !currentMap.getSource('resume-points')) {
                            // console.log("Map/Source gone, skipping fade-in state clear.");
                            stateClearTimeoutIdRef.current = null;
                            return;
                        }
                        // console.log(`Removing 'fade-in' state for ${newFeaturesToClearState.length} features.`);
                        // MODIFIED: Always attempt to clear state, remove querySourceFeatures check
                        newFeaturesToClearState.forEach(id => {
                            try {
                                // Always attempt to clear the state. Mapbox will handle rendering based on zoom/filter.
                                currentMap.setFeatureState({ source: 'resume-points', id: id }, { 'fade-in': null });
                            } catch (e) {
                                // Ignore errors if the feature genuinely doesn't exist anymore
                                // console.warn(`Error clearing fade-in state for ${id} (might be expected if feature removed):`, e);
                            }
                        });
                        newFeaturesToClearState.length = 0; // Clear the array
                        stateClearTimeoutIdRef.current = null; // Clear the ref ID
                    }, FADE_DURATION);
                    stateClearTimeoutIdRef.current = localStateClearTimeoutId; // Store ID in ref
                }

                // --- Step 4: Cleanup Temporary Fade-Out Layers ---
                await new Promise(r => setTimeout(r, FADE_DURATION + 100));
                layersToRemove.forEach(id => { if (map?.getLayer(id)) map.removeLayer(id); }); // Check map still exists
                if (tempSource && map?.getSource('temp-animation-source')) { tempSource.setData({ type: 'FeatureCollection', features: [] }); }
                // console.log("Fade animation processing complete.");

            } catch (error) {
                console.error("Error during selective update:", error);
                try{ const source=map?.getSource('resume-points'); if(source) source.setData(filteredGeojsonData); previousFilteredDataRef.current=JSON.stringify(filteredGeojsonData); }catch(fbErr){}
            } finally {
                setIsTransitioning(false); // Ensure transition state is reset
            }
        }; // End updateSourceSelectively

        updateSourceSelectively();

         // Cleanup function for the effect
         return () => {
             if (stateClearTimeoutIdRef.current) {
                 // console.log("Effect cleanup: Clearing scheduled fade-in state removal.");
                 clearTimeout(stateClearTimeoutIdRef.current);
                 stateClearTimeoutIdRef.current = null;
                 // We don't need to immediately clear state here, as the component is unmounting
             }
         };

    }, [isMapLoaded, filteredGeojsonData, isSliderDragging]); // Effect dependencies

    // --- Navigation Handlers ---
    const handleNavigate = useCallback((direction) => {
        const currentFeatures = filteredGeojsonData.features;
        if (!currentFeatures || currentFeatures.length === 0 || selectedIndex === -1) return;

        let newIndex;
        if (direction === 'prev') {
            newIndex = selectedIndex > 0 ? selectedIndex - 1 : currentFeatures.length - 1; // Wrap around
        } else { // 'next'
            newIndex = selectedIndex < currentFeatures.length - 1 ? selectedIndex + 1 : 0; // Wrap around
        }

        const newFeature = currentFeatures[newIndex];
        if (newFeature?.properties) {
            // Get the complete data from the original source to ensure all properties are included
            const originalData = resumeData.find(item => item.id === newFeature.id);
            setSelectedNodeData(originalData || newFeature.properties);
            setSelectedIndex(newIndex);
            // Optional: Fly to the new point on the map
            if (mapRef.current && newFeature.geometry?.coordinates) {
                // Check if the point is clustered
                const isClustered = newFeature.properties.point_count > 1;

                // Adjust zoom level based on whether the point is clustered
                const zoomLevel = isClustered ? Math.max(mapRef.current.getZoom(), 8) : 12;

                mapRef.current.flyTo({
                    center: newFeature.geometry.coordinates,
                    zoom: zoomLevel, // Zoom in if needed, but not too far
                    duration: 4500 // Animation duration in ms
                });
            }
        }
    }, [filteredGeojsonData.features, selectedIndex]);

    // --- Effect for applying hover style to selected node ---
    useEffect(() => {
        if (mapRef.current && selectedNodeData) {
            // Clear any existing hover state
            if (hoveredStateIdRef.current !== null) {
                try {
                    mapRef.current.setFeatureState(
                        { source: 'resume-points', id: hoveredStateIdRef.current },
                        { hover: false }
                    );
                } catch (e) {
                    console.error("Error clearing hover state:", e);
                }
            }

            // Set hover state for the selected node
            hoveredStateIdRef.current = selectedNodeData.id;
            try {
                mapRef.current.setFeatureState(
                    { source: 'resume-points', id: selectedNodeData.id },
                    { hover: true }
                );
            } catch (e) {
                console.error("Error setting hover state:", e);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeData]);

    const handleNavigatePrev = useCallback(() => handleNavigate('prev'), [handleNavigate]);
    const handleNavigateNext = useCallback(() => handleNavigate('next'), [handleNavigate]);

    // --- Reset View Handler ---
    const handleResetView = useCallback(() => {
        if (!mapRef.current) return;
        console.log("Reset View Clicked - Flying map only"); // Add log for debugging

        // Reset map position and zoom
        mapRef.current.flyTo({
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom,
            duration: 1500 // Animation duration
        });

        // Reset filters
        setActiveFilters(['education', 'work', 'publication', 'conference']);

        // Reset timeline
        setDisplayYear(maxYear);
        // Use a timeout to ensure the debounced function doesn't immediately override
        setTimeout(() => {
            setCurrentYear(maxYear);
            // Cancel any pending debounced year change from slider interaction
            debouncedYearChange.cancel();
        }, 50); // Small delay

        // Close contextual panel
        setSelectedNodeData(null);
        setSelectedIndex(-1);

    }, [initialViewState, maxYear, debouncedYearChange]); // Dependencies - Restored

    // --- Effect for Esc key to close contextual panel ---
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && selectedNodeData) {
                console.log('Esc key pressed, closing contextual panel');
                setSelectedNodeData(null);
                setSelectedIndex(-1);
                selectedNodeIdRef.current = null; // Clear ref
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNodeData]); // Only depend on selectedNodeData

    // --- JSX Rendering ---
    return (
        <div className="map-page-wrapper"> {/* Main wrapper for positioning */}

            {/* Map container div */}
            <div ref={mapContainerRef} className="map-container"></div>

            {/* Optional: Indicator shown during data processing (if you re-add isTransitioning) */}
            {/* {isTransitioning && <div className="map-transition-indicator">Updating...</div>} */}

            {/* Controls Overlay Panel */}
            <div className={`map-controls-overlay ${!filtersVisible ? 'collapsed' : ''}`}>
                 {/* Toggle Button for Controls */}
                 <button
                     className="toggle-button"
                     onClick={() => setFiltersVisible(v => !v)}
                    //  disabled={isTransitioning} // Can re-enable if needed
                     aria-expanded={filtersVisible}
                     aria-controls="collapsible-map-controls"
                 >
                     {filtersVisible ? 'Hide Controls ▼' : 'Show Controls ▲'}
                 </button>

                 {/* Collapsible Content Area */}
                 <div id="collapsible-map-controls" className={`collapsible-content ${!filtersVisible ? 'hidden' : ''}`}>
                     {/* Render actual controls only if date range is valid */}
                     {(minYear !== Infinity && maxYear !== -Infinity) ? (
                         <>
                             <MapFilters // Your actual component
                                 activeFilters={activeFilters}
                                 onFilterChange={handleFilterChange}
                                //  disabled={isTransitioning}
                             />
                             <TimelineSlider // Your actual component
                                 minYear={minYear}
                                 maxYear={maxYear}
                                 currentYear={displayYear}
                                 onYearChange={handleSliderChange}
                                 onDragStart={handleSliderDragStart}
                                 onDragEnd={handleSliderDragEnd}
                                //  disabled={isTransitioning}
                                 isDragging={isSliderDragging}
                             />
                             {/* Reset Button */}
                             <Button
                                 onClick={handleResetView}
                                 variant="secondary" // Or choose another appropriate variant
                                 size="small"
                                 style={{ marginTop: 'var(--spacing-medium)', width: '100%' }} // Add some top margin and make full width
                             >
                                 <Icon name="RefreshCcw" size={14} style={{ marginRight: '6px' }} /> Reset View
                             </Button>
                         </>
                     ) : (
                         <p>Loading controls...</p> // Or a spinner
                     )}
                 </div>
            </div>

            {/* --- Conditionally Render Contextual Panel --- */}
            {/* This will only render when selectedNodeData is not null */}
            {selectedNodeData && (
                <ContextualPanel
                    data={selectedNodeData} // Pass the selected node's data as a prop
                    onClose={() => {
                        setSelectedNodeData(null);
                        setSelectedIndex(-1); // Reset index on close
                    }}
                    // Navigation Props
                    onNavigatePrev={handleNavigatePrev}
                    onNavigateNext={handleNavigateNext}
                    currentIndex={selectedIndex}
                    totalItems={filteredGeojsonData.features.length}
                />
            )}
            {/* --- End Contextual Panel --- */}

        </div> // End map-page-wrapper
    );
}

// ... (Helper functions like convertToGeoJSON, config like nodeLayersConfig if defined outside) ...

export default SpatialResumeMap;
