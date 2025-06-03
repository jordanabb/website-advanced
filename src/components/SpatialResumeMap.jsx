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
        const coordinates = [item.lon, item.lat];
        return { type: 'Feature', id: featureId, geometry: { type: 'Point', coordinates: coordinates }, properties: { ...item } };
    }).filter(feature => feature !== null);
    return { type: 'FeatureCollection', features: features };
}

// Function to add a small deterministic jitter to coordinates based on ID
function jitterCoordinates(coordinates, amount = 0.05, seed = null) {
    // Use a simple hash function to create deterministic "random" values based on coordinates
    // This ensures the same coordinates always get the same jitter
    let hash = 0;
    if (seed !== null) {
        // Use seed (like node ID) for deterministic jittering
        const str = seed.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
    } else {
        // Fallback: use coordinates as seed
        const str = coordinates[0].toString() + coordinates[1].toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
    }
    
    // Convert hash to pseudo-random values between -0.5 and 0.5
    const pseudoRandom1 = ((hash % 1000) / 1000) - 0.5;
    const pseudoRandom2 = (((hash >> 10) % 1000) / 1000) - 0.5;
    
    const lng = coordinates[0] + pseudoRandom1 * amount;
    const lat = coordinates[1] + pseudoRandom2 * amount;
    return [lng, lat];
}

// Function to create a curved arrow path between two points
function createCurvedArrow(startCoords, endCoords, baseCurvature = 0.2) {
    const [startLng, startLat] = startCoords;
    const [endLng, endLat] = endCoords;
    
    // Calculate distance and adjust curvature based on distance
    const deltaLng = endLng - startLng;
    const deltaLat = endLat - startLat;
    const distance = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
    
    // Adaptive curvature: reduce curvature for very long distances
    // This prevents extreme distortion on long-distance arrows
    let curvature = baseCurvature;
    if (distance > 50) { // Very long distance (e.g., cross-continental)
        curvature = Math.max(0.05, baseCurvature * (20 / distance));
    } else if (distance > 20) { // Long distance
        curvature = Math.max(0.1, baseCurvature * (10 / distance));
    } else if (distance > 10) { // Medium distance
        curvature = Math.max(0.15, baseCurvature * (5 / distance));
    }
    
    // Calculate midpoint
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;
    
    // Create control point for curve with adaptive offset
    // Use a more conservative offset calculation for long distances
    const offsetLng = -deltaLat * curvature;
    const offsetLat = deltaLng * curvature;
    
    const controlLng = midLng + offsetLng;
    const controlLat = midLat + offsetLat;
    
    // Increase number of points for longer distances to ensure smooth drawing
    const numPoints = Math.max(20, Math.min(50, Math.floor(distance * 2)));
    
    // Generate points along the curve using quadratic Bézier formula
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * controlLng + t * t * endLng;
        const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * controlLat + t * t * endLat;
        points.push([lng, lat]);
    }
    
    return points;
}

// Function to find projects associated with a node
function findAssociatedProjects(nodeData) {
    const projects = [];
    
    // Check if the node itself is a project with case study locations
    if (nodeData.type === 'project' && nodeData.caseStudyLocations) {
        projects.push({
            ...nodeData,
            sourceCoords: [nodeData.lon, nodeData.lat]
        });
    }
    
    // Check if the node has nested projects (work/education entries)
    if (nodeData.projects && Array.isArray(nodeData.projects)) {
        nodeData.projects.forEach(project => {
            if (project.caseStudyLocations) {
                projects.push({
                    ...project,
                    sourceCoords: [nodeData.lon, nodeData.lat]
                });
            }
        });
    }
    
    return projects;
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
    const currentArrowsRef = useRef([]); // Track current arrow layers for cleanup

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

    // Function to clean up existing arrows and popups
    const cleanupArrows = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        currentArrowsRef.current.forEach(layerId => {
            // Handle popup cleanup
            if (layerId.startsWith('popup-')) {
                // Find and remove the popup by class
                const popups = document.querySelectorAll('.case-study-popup');
                popups.forEach(popupElement => {
                    // Remove the popup element directly
                    if (popupElement && popupElement.remove) {
                        popupElement.remove();
                    }
                });
                return;
            }
            
            // Handle layer and source cleanup
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            if (map.getSource(layerId)) {
                map.removeSource(layerId);
            }
        });
        
        // Also remove any remaining case study popups using a more direct approach
        const allCaseStudyPopups = document.querySelectorAll('.case-study-popup');
        allCaseStudyPopups.forEach(popupElement => {
            if (popupElement && popupElement.remove) {
                popupElement.remove();
            }
        });
        
        currentArrowsRef.current = [];
    }, []);

    // Function to calculate optimal bounds for viewing arrows
    const calculateArrowBounds = useCallback((sourceCoords, caseStudyLocations) => {
        const allCoords = [sourceCoords, ...caseStudyLocations.map(loc => [loc.lon, loc.lat])];
        
        const lngs = allCoords.map(coord => coord[0]);
        const lats = allCoords.map(coord => coord[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        // Add padding (10% of the range)
        const lngRange = maxLng - minLng;
        const latRange = maxLat - minLat;
        const padding = 0.1;
        
        return {
            sw: [minLng - lngRange * padding, minLat - latRange * padding],
            ne: [maxLng + lngRange * padding, maxLat + latRange * padding]
        };
    }, []);

    // Function to reset map view to the work experience node
    const resetMapToWorkNode = useCallback(() => {
        const map = mapRef.current;
        if (!map || !selectedNodeData) return;

        // Clean up any existing arrows and popups first
        cleanupArrows();

        // Get the coordinates of the selected work experience node
        const nodeCoords = [selectedNodeData.lon, selectedNodeData.lat];
        
        // Find the actual jittered coordinates from the map source data
        let actualNodeCoords = nodeCoords;
        try {
            const mapSource = map.getSource('resume-points');
            if (mapSource && mapSource._data && mapSource._data.features) {
                const sourceFeatureFromData = mapSource._data.features.find(f => 
                    f.properties && f.properties.id === selectedNodeData.id
                );
                if (sourceFeatureFromData && sourceFeatureFromData.geometry && sourceFeatureFromData.geometry.coordinates) {
                    actualNodeCoords = sourceFeatureFromData.geometry.coordinates;
                }
            }
        } catch (e) {
            console.warn('Error finding jittered coordinates for reset:', e);
        }

        // Fly to the work experience node with appropriate zoom
        map.flyTo({
            center: actualNodeCoords,
            zoom: 12, // Increased zoom level to focus more closely on the work location
            duration: 2000 // Increased from original 1500ms to 2000ms for slower animation
        });
    }, [selectedNodeData, cleanupArrows]);

    // Function to create animated arrows for a specific project
    const createAnimatedArrowsForProject = useCallback((project, sourceCoords) => {
        const map = mapRef.current;
        if (!map || !project || !project.caseStudyLocations || !sourceCoords) return;

        // Clean up existing arrows first
        cleanupArrows();

        // Find the actual jittered coordinates from the map source data
        let actualSourceCoords = sourceCoords;
        try {
            // Get the coordinates from the map source data which contains the jittered positions
            const mapSource = map.getSource('resume-points');
            if (mapSource && mapSource._data && mapSource._data.features) {
                const sourceFeatureFromData = mapSource._data.features.find(f => 
                    f.properties && f.properties.id === selectedNodeData?.id
                );
                if (sourceFeatureFromData && sourceFeatureFromData.geometry && sourceFeatureFromData.geometry.coordinates) {
                    actualSourceCoords = sourceFeatureFromData.geometry.coordinates;
                    console.log('Found jittered coordinates from map source:', actualSourceCoords);
                } else {
                    console.warn('Could not find feature in map source data, using original coordinates');
                }
            } else {
                console.warn('Map source not available, using original coordinates');
            }
        } catch (e) {
            console.warn('Error finding jittered coordinates:', e);
        }

        // Calculate optimal bounds and smoothly zoom to fit all arrows
        const bounds = calculateArrowBounds(actualSourceCoords, project.caseStudyLocations);
        
        // Animate to the optimal view with extra padding for contextual panel
        map.fitBounds([bounds.sw, bounds.ne], {
            padding: { 
                top: 80, 
                bottom: 80, 
                left: 80, 
                right: 520 // Extra padding for contextual panel on desktop
            },
            duration: 3000, // Increased from original 2500ms to 3000ms for slower zoom
            essential: true // This animation is essential and won't be interrupted
        });

        // Get theme-appropriate colors
        const theme = detectCurrentTheme();
        const arrowColor = theme === 'light' ? '#2563eb' : '#60a5fa'; // Blue variants
        const markerColor = theme === 'light' ? '#dc2626' : '#f87171'; // Red variants

        // Track all animation promises to know when all arrows are complete
        const animationPromises = [];

        project.caseStudyLocations.forEach((location, locationIndex) => {
            const layerId = `arrow-${project.id}-${locationIndex}`;
            const markerId = `marker-${project.id}-${locationIndex}`;
            
            // Create curved arrow path using the actual jittered coordinates
            const fullArrowPath = createCurvedArrow(
                actualSourceCoords,
                [location.lon, location.lat],
                0.2 // curvature
            );

            // Add arrow line source (initially with just the start point)
            map.addSource(layerId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [fullArrowPath[0]] // Start with just the first point
                    }
                }
            });

            map.addLayer({
                id: layerId,
                type: 'line',
                source: layerId,
                paint: {
                    'line-color': arrowColor,
                    'line-width': 3,
                    'line-opacity': 0.9
                }
            });

            // No arrowheads - lines will extend all the way to case study locations

            // Add case study location marker (initially hidden)
            map.addSource(markerId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [location.lon, location.lat]
                    },
                    properties: {
                        name: location.name,
                        description: location.description
                    }
                }
            });

            map.addLayer({
                id: markerId,
                type: 'circle',
                source: markerId,
                paint: {
                    'circle-radius': 5,
                    'circle-color': markerColor,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0 // Start hidden
                }
            });

            // Track layers for cleanup
            currentArrowsRef.current.push(layerId, markerId);

            // Create animation promise for this arrow
            const animationPromise = new Promise((resolve) => {
                // Animate the arrow drawing
                const animationDuration = 1000; // 1 second
                const steps = 30;
                const stepDuration = animationDuration / steps;
                
                let currentStep = 0;
                const animateArrow = () => {
                    if (currentStep >= steps || !map.getSource(layerId)) {
                        // Animation complete - ensure the full path is shown and show the marker
                        const source = map.getSource(layerId);
                        if (source) {
                            source.setData({
                                type: 'Feature',
                                geometry: {
                                    type: 'LineString',
                                    coordinates: fullArrowPath // Ensure full path is displayed
                                }
                            });
                        }
                        if (map.getLayer(markerId)) {
                            map.setPaintProperty(markerId, 'circle-opacity', 0.9);
                        }
                        
                        // Resolve the promise when this arrow animation is complete
                        resolve({ location, markerId });
                        return;
                    }

                    const progress = currentStep / steps;
                    const pointsToShow = Math.max(1, Math.floor(progress * fullArrowPath.length));
                    const currentPath = fullArrowPath.slice(0, pointsToShow);

                    // Update the line with more points
                    const source = map.getSource(layerId);
                    if (source) {
                        source.setData({
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: currentPath
                            }
                        });
                    }

                    currentStep++;
                    setTimeout(animateArrow, stepDuration);
                };

                // Start the animation after a small delay
                setTimeout(animateArrow, 100);
            });

            animationPromises.push(animationPromise);
        });

        // Wait for all arrows to finish, then show popups
        Promise.all(animationPromises).then((completedAnimations) => {
            // Check if the map still exists and arrows haven't been cleaned up
            if (!mapRef.current || currentArrowsRef.current.length === 0) {
                return; // Don't show popups if cleanup already happened
            }
            
            // Add a small delay before showing popups
            setTimeout(() => {
                // Double-check that we still have arrows (user might have stopped hovering)
                if (!mapRef.current || currentArrowsRef.current.length === 0) {
                    return;
                }
                
                completedAnimations.forEach(({ location, markerId }) => {
                    // Create and show popup for each case study location
                    const popup = new mapboxgl.Popup({
                        closeButton: true,
                        closeOnClick: false,
                        offset: 15,
                        className: 'case-study-popup'
                    })
                    .setLngLat([location.lon, location.lat])
                    .setHTML(`
                        <div class="case-study-popup-content">
                            ${location.url ? 
                                `<h4 class="case-study-popup-title"><a href="${location.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; border: none; outline: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${location.name}</a></h4>` : 
                                `<h4 class="case-study-popup-title">${location.name}</h4>`
                            }
                            <p class="case-study-popup-description">${location.description}</p>
                        </div>
                    `)
                    .addTo(map);

                    // Track popup for cleanup
                    currentArrowsRef.current.push(`popup-${markerId}`);
                    
                    // Store popup reference for cleanup
                    popup._caseStudyPopup = true;
                    popup._popupId = `popup-${markerId}`;
                });
            }, 300); // Small delay after arrows complete
        });
    }, [cleanupArrows, detectCurrentTheme]);

    // Function to create arrows for a hovered node (kept for compatibility)
    const createArrowsForNode = useCallback((nodeData) => {
        const map = mapRef.current;
        if (!map || !nodeData) return;

        // Clean up existing arrows first
        cleanupArrows();

        // Find associated projects
        const projects = findAssociatedProjects(nodeData);
        if (projects.length === 0) return;

        // Get theme-appropriate colors
        const theme = detectCurrentTheme();
        const arrowColor = theme === 'light' ? '#2563eb' : '#60a5fa'; // Blue variants
        const markerColor = theme === 'light' ? '#dc2626' : '#f87171'; // Red variants

        projects.forEach((project, projectIndex) => {
            if (!project.caseStudyLocations) return;

            project.caseStudyLocations.forEach((location, locationIndex) => {
                const layerId = `arrow-${nodeData.id}-${projectIndex}-${locationIndex}`;
                const markerId = `marker-${nodeData.id}-${projectIndex}-${locationIndex}`;
                
                // Create curved arrow path
                const arrowPath = createCurvedArrow(
                    project.sourceCoords,
                    [location.lon, location.lat],
                    0.2 // curvature
                );

                // Add arrow line source and layer
                map.addSource(layerId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: arrowPath
                        }
                    }
                });

                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    paint: {
                        'line-color': arrowColor,
                        'line-width': 2,
                        'line-opacity': 0.8
                    }
                });

                // Add case study location marker
                map.addSource(markerId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [location.lon, location.lat]
                        },
                        properties: {
                            name: location.name,
                            description: location.description
                        }
                    }
                });

                map.addLayer({
                    id: markerId,
                    type: 'circle',
                    source: markerId,
                    paint: {
                        'circle-radius': 4,
                        'circle-color': markerColor,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#ffffff',
                        'circle-opacity': 0.9
                    }
                });

                // Track layers for cleanup
                currentArrowsRef.current.push(layerId, markerId);
            });
        });
    }, [cleanupArrows, detectCurrentTheme]);

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
            map.on('mousemove', mainId, e => { 
                if(isTransitioning) return; 
                if(e.features?.length > 0){ 
                    const currentId=e.features[0].id; 
                    if(hoveredStateIdRef.current !== currentId){ 
                        if(hoveredStateIdRef.current !== null) {
                            try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:false});}catch(e){}
                        }
                        hoveredStateIdRef.current=currentId; 
                        try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:true});}catch(e){}
                    }
                } else { 
                    if(hoveredStateIdRef.current !== null) {
                        try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:false}); hoveredStateIdRef.current=null;}catch(e){}
                    }
                }
            });
            map.on('mouseleave', mainId, () => { 
                if(isTransitioning) return; 
                if(hoveredStateIdRef.current !== null) {
                    try{map.setFeatureState({source:'resume-points',id:hoveredStateIdRef.current},{hover:false}); hoveredStateIdRef.current=null;}catch(e){}
                }
                popupRef.current?.remove(); 
                map.getCanvas().style.cursor=''; 
            });
            map.on('mouseenter', mainId, e => { 
                if(isTransitioning) return; 
                map.getCanvas().style.cursor='pointer'; 
                const f=e.features?.[0]; 
                if(!f?.geometry?.coordinates || !f?.properties) return; 
                const co=f.geometry.coordinates.slice(); 
                while(Math.abs(e.lngLat.lng-co[0])>180){co[0]+=e.lngLat.lng>co[0]?360:-360;} 
                const p=f.properties; 
                const d=`<strong>${p.title||'Untitled'}</strong><br>Type: ${p.type||'N/A'}<br>Loc: ${p.location||'N/A'}${p.startDate?`<br>Start: ${p.startDate}`:''}${p.endDate && p.endDate !== "Present" ?`<br>End: ${p.endDate}`:''}${p.endDate === "Present" ? `<br>Ongoing`:''}${p.date&&!p.startDate?`<br>Date: ${p.date}`:''}`; 
                if(popupRef.current?.setLngLat){popupRef.current.setLngLat(co).setHTML(d).addTo(map);} 
            });
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
                 cleanupArrows(); // Clean up case studies when panel closes
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
                            coordinates: [-78.0904984, 38.9210639] // Washington DC
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
        return () => { if (mapRef.current) { console.log("Cleaning up map."); cleanupArrows(); popupRef.current?.remove(); mapRef.current.remove(); mapRef.current = null; setIsMapLoaded(false); hoveredStateIdRef.current = null; if(stateClearTimeoutIdRef.current) clearTimeout(stateClearTimeoutIdRef.current); } }; // Cleanup timeout too
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

        // Clean up arrows when navigating to a different panel
        cleanupArrows();

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
    }, [filteredGeojsonData.features, selectedIndex, cleanupArrows]);

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

    // --- View Current Work Handler ---
    const handleViewCurrentWork = useCallback(() => {
        console.log("View Current Work Clicked");
        
        // Find the New America work experience in the data
        const newAmericaWork = resumeData.find(item => 
            item.id === 'work002' && item.institution === 'New America'
        );
        
        if (newAmericaWork) {
            // Find the index of this node in the current filtered data
            const currentFeatures = filteredGeojsonData.features;
            const index = currentFeatures.findIndex(f => f.id === newAmericaWork.id);
            
            // Set the selected node data and index
            setSelectedNodeData(newAmericaWork);
            setSelectedIndex(index !== -1 ? index : 0); // Use 0 as fallback
            selectedNodeIdRef.current = newAmericaWork.id;
            
            // Fly to the New America location on the map
            if (mapRef.current && newAmericaWork.lon && newAmericaWork.lat) {
                mapRef.current.flyTo({
                    center: [newAmericaWork.lon, newAmericaWork.lat],
                    zoom: 12,
                    duration: 4000
                });
            }
        } else {
            console.warn('New America work experience not found in data');
        }
    }, [filteredGeojsonData.features]);

    // --- Effect for Esc key to close contextual panel ---
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && selectedNodeData) {
                console.log('Esc key pressed, closing contextual panel');
                cleanupArrows(); // Clean up case studies when panel closes
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
    }, [selectedNodeData, cleanupArrows]); // Include cleanupArrows in dependencies

    // --- Effect to listen for header title click events ---
    useEffect(() => {
        const handleOpenContextualPanel = (event) => {
            const { nodeData } = event.detail;
            if (nodeData) {
                console.log('Opening contextual panel from header click:', nodeData.id);
                
                // Find the index of this node in the current filtered data
                const currentFeatures = filteredGeojsonData.features;
                const index = currentFeatures.findIndex(f => f.id === nodeData.id);
                
                // Set the selected node data and index
                setSelectedNodeData(nodeData);
                setSelectedIndex(index !== -1 ? index : 0); // Use 0 as fallback
                selectedNodeIdRef.current = nodeData.id;
                
                // Fly to the node on the map if it exists
                if (mapRef.current && nodeData.lon && nodeData.lat) {
                    // Use the hardcoded coordinates from the data
                    const nodeCoords = [nodeData.lon, nodeData.lat];
                    
                    mapRef.current.flyTo({
                        center: nodeCoords,
                        zoom: 12,
                        duration: 2000
                    });
                }
            }
        };

        // Add event listener
        document.addEventListener('openContextualPanel', handleOpenContextualPanel);

        // Cleanup
        return () => {
            document.removeEventListener('openContextualPanel', handleOpenContextualPanel);
        };
    }, [filteredGeojsonData.features]); // Re-run when filtered data changes

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
                             {/* Control Buttons Row */}
                             <div style={{ 
                                 display: 'flex', 
                                 gap: '12px', 
                                 marginTop: '16px' 
                             }}>
                                 <Button
                                     onClick={handleResetView}
                                     variant="secondary"
                                     size="small"
                                     style={{ flex: 1 }}
                                 >
                                     <Icon name="RefreshCcw" size={14} style={{ marginRight: '6px' }} /> Reset View
                                 </Button>
                                 <Button
                                     onClick={handleViewCurrentWork}
                                     variant="secondary"
                                     size="small"
                                     style={{ flex: 1 }}
                                 >
                                     <Icon name="Briefcase" size={14} style={{ marginRight: '6px' }} /> View Current Work
                                 </Button>
                             </div>
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
                        cleanupArrows(); // Clean up arrows when closing panel
                    }}
                    // Navigation Props
                    onNavigatePrev={handleNavigatePrev}
                    onNavigateNext={handleNavigateNext}
                    currentIndex={selectedIndex}
                    totalItems={filteredGeojsonData.features.length}
                    // Arrow animation props
                    onProjectHover={createAnimatedArrowsForProject}
                    onProjectLeave={() => {}} // Don't cleanup on hover leave - popups should persist
                    onDescriptionHover={resetMapToWorkNode} // Reset map view when hovering over description
                />
            )}
            {/* --- End Contextual Panel --- */}

        </div> // End map-page-wrapper
    );
}

// ... (Helper functions like convertToGeoJSON, config like nodeLayersConfig if defined outside) ...

export default SpatialResumeMap;
