// src/components/SpatialResumeMap.jsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './SpatialResumeMap.css'; // Ensure this CSS file exists and imports mapbox-gl.css

// Access token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function SpatialResumeMap() {
  const mapContainerRef = useRef(null); // Ref for the map container DOM element
  const mapRef = useRef(null); // Ref for the Mapbox map instance

  // Initial map view state
  const [initialLng] = useState(-98.5795); // Center of US approx
  const [initialLat] = useState(39.8283);
  const [initialZoom] = useState(3.5);

  // State to track if map is loaded (optional, but can be useful)
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Ensure Mapbox token is available
    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token not found. Please set VITE_MAPBOX_TOKEN in your .env file and restart the dev server.");
      return; // Stop initialization if no token
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Prevent map from initializing multiple times
    if (mapRef.current) return;

    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,          // Target container element
      style: 'mapbox://styles/mapbox/dark-v11',    // Start with a standard dark style
      center: [initialLng, initialLat],            // Initial center
      zoom: initialZoom,                           // Initial zoom
      renderWorldCopies: false, // Prevent map repeating horizontally
      // Optional: Disable rotation for simpler interaction
      // pitchWithRotate: false,
      // dragRotate: false,
      // touchZoomRotate: false,
    });

    const map = mapRef.current; // Local variable for convenience

    // --- Event Listeners ---

    // Map 'load' event - Essential for applying custom styles
    map.on('load', () => {
      console.log('Map style loaded! Applying custom styles...');
      setIsMapLoaded(true); // Update state

      // --- Apply Custom "Blueprint" Styling ---
      try {
        // --- Land Styling ---
        const landAndRelatedLayers = ['land', 'national-park', 'landuse']; // Target primary land and related land types
        landAndRelatedLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
            try { // Add a try-catch around paint properties for safety
                // Use our subtle dark grey for these land areas
                map.setPaintProperty(layerId, 'fill-color', '#161B22');

                // REMOVE THE CHECK: Directly attempt to set the outline color.
                // Mapbox usually ignores setting properties that don't apply or exist for a layer type.
                map.setPaintProperty(layerId, 'fill-outline-color', '#161B22'); // Match fill

                console.log(`Styled land layer: ${layerId}`);

            } catch (paintError) {
                    console.warn(`Could not set paint properties for layer ${layerId}:`, paintError.message);
            }
            } else {
                console.warn(`Land layer ID '${layerId}' not found or accessible at current state.`);
            }
        });

        const waterLayers = ['water'];
        waterLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            try { // Add try-catch for paint properties
              map.setPaintProperty(layerId, 'fill-color', '#0D1117'); // Page background
              // Directly attempt to set outline color
              map.setPaintProperty(layerId, 'fill-outline-color', '#0D1117'); // Match fill
              console.log(`Styled water layer: ${layerId}`);
            } catch (paintError) {
                 // Log specific paint error for this layer if it occurs
                 console.warn(`Could not set paint properties for layer ${layerId}:`, paintError.message);
            }
          } else {
              console.warn(`Water layer ID '${layerId}' not found or accessible.`);
          }
        });

        // --- Border Styling ---
        const adminBoundaryLayers = [
          'admin-1-boundary-bg', 'admin-0-boundary-bg',
          'admin-1-boundary', 'admin-0-boundary',
          'admin-0-boundary-disputed' // Include disputed if needed
        ];
        adminBoundaryLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'line-color', '#30363D'); // Subtle dark grey border
            map.setPaintProperty(layerId, 'line-width', 0.5);
            map.setPaintProperty(layerId, 'line-opacity', 0.7);
             // Hide background casings if desired
             if (layerId.includes('-bg')) {
                map.setPaintProperty(layerId, 'line-opacity', 0);
             }
          }
        });

        // --- Remove Labels, Icons, Roads ---
        const layers = map.getStyle().layers;
        layers.forEach(layer => {
          // Remove text labels and icons by hiding all symbol layers
          if (layer.type === 'symbol') {
             map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
          // Hide road/rail/bridge/aeroway layers explicitly by ID pattern
           if (layer.id.includes('road') || layer.id.includes('bridge') || layer.id.includes('tunnel') || layer.id.includes('railway') || layer.id.includes('transit') || layer.id.includes('aeroway')) {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
           }
           // Optionally hide building outlines too
           if (layer.id === 'building') {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
           }
        });

        console.log('Custom styles applied successfully.');

      } catch (error) {
        // Catch errors during styling application
        console.error("Error applying custom map styles:", error);
        // Log available layers ONLY if an error occurs during styling
        // try { console.log("Available layers during error:", map.getStyle().layers.map(l => l.id)); } catch {}
      }

      // --- Add Data Layers Here (Future Chunk) ---
      // console.log("Ready to add data sources and layers.");

    }); // End of map.on('load')

    // Optional: Add navigation controls (Zoom, Compass)
    // Consider if needed given the minimalist aesthetic
    // map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Optional: Error handling for general map errors
    map.on('error', (e) => {
        // Ignore specific 'background' layer error if it persists from other sources
        if (e?.error?.message?.includes("layer 'background' does not exist")) {
            return;
        }
        console.error("Mapbox error:", e);
    });

    // --- Clean up on component unmount ---
    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // Clean up the map instance
        mapRef.current = null; // Clear the ref
        setIsMapLoaded(false); // Reset loaded state
        console.log("Map removed on unmount.");
      }
    };
  }, [initialLng, initialLat, initialZoom]); // Dependency array ensures this effect runs only once on mount

  // Render the container div for the map
  return (
    <div ref={mapContainerRef} className="map-container">
      {/* Optionally show loading state until map is ready */}
      {!isMapLoaded && !MAPBOX_TOKEN && <div style={{ padding: '20px', color: '#CDD9E5' }}>Error: Mapbox Token Missing.</div>}
      {/* {!isMapLoaded && MAPBOX_TOKEN && <div style={{ padding: '20px', color: '#CDD9E5' }}>Loading Map...</div>} */}
    </div>
  );
}

export default SpatialResumeMap;