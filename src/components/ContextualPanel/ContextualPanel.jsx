// src/components/ContextualPanel/ContextualPanel.jsx
// --- Complete Code: Animated Canvas "Fake Voronoi" with DPR Fix ---

import React, { useEffect, useRef, useCallback, useState } from 'react';
import debounce from 'lodash.debounce'; // Ensure installed: npm install lodash.debounce

// Import UI Components (ADJUST PATHS AS NEEDED)
import { Heading, Text } from '../ui/Typography/Typography';
import Button from '../ui/Button/Button';
import Icon from '../ui/Icon/Icon';
import styles from './ContextualPanel.module.css'; // Import CSS Module

// --- Configuration for Canvas Pattern ---
const LINE_COLOR = "rgba(255, 215, 0, 0.3)"; // Gold color @ 70% opacity
const LINE_WIDTH = .35;                     // Thin lines (try 1 if needed)
const NUM_POINTS = 60;                      // Number of "cell centers"
const CONNECTION_RADIUS = 200;              // Max distance to connect points
const ANIMATION_DURATION = 3000;            // Duration for lines to draw (in ms)

// --- Drawing Function for Static Pattern (Handles DPR) ---
// This function sets up the canvas size and can draw the full static pattern
const drawGenerativeLines = (canvas) => {
    if (!canvas) {
        // console.warn("drawGenerativeLines: Canvas ref null");
        return false; // Indicate failure
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("drawGenerativeLines: Could not get 2D context");
        return false; // Indicate failure
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        // console.warn(`drawGenerativeLines: Canvas dimensions zero (${rect.width}x${rect.height}).`);
        return false; // Indicate failure (layout not ready)
    }

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = rect.width;
    const cssHeight = rect.height;
    const bufferWidth = Math.round(cssWidth * dpr);
    const bufferHeight = Math.round(cssHeight * dpr);

    // Set Correct Buffer Size if needed
    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
        // console.log(`Canvas buffer resized to: ${bufferWidth}x${bufferHeight}`);
    }

    // Scale Context Correctly
    ctx.resetTransform(); // Reset any previous scaling/transformations
    ctx.scale(dpr, dpr);  // Scale context to match DPR

    // Clear Canvas
    ctx.clearRect(0, 0, cssWidth, cssHeight); // Clear using CSS dimensions

    // Return true if setup was successful (context ready, dimensions non-zero)
    return true;
};

// --- Animation Drawing Function ---
// Draws a subset of lines based on progress
const animateDrawing = (canvas, startTime, connections) => {
    if (!canvas || !connections) return null; // Return null if animation can't proceed
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const currentTime = performance.now();
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / ANIMATION_DURATION, 1); // Clamp progress

    const numLinesToDraw = Math.ceil(connections.length * progress);
    // Ensure slicing doesn't go out of bounds if connections array is empty
    const linesToDraw = connections.slice(0, numLinesToDraw);

    // --- Drawing ---
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // Assume buffer size is correct from drawGenerativeLines or previous frame

    // Clear canvas (using save/restore to preserve transform state)
    ctx.save();
    ctx.resetTransform(); // Reset to clear correctly based on buffer size
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore(); // Restore previous state (includes dpr scaling)

    // Set styles and draw the subset of lines
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    linesToDraw.forEach(line => {
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
    });
    ctx.stroke();
    // --- End Drawing ---

    let frameId = null;
    if (progress < 1) {
        // Request next frame, passing necessary arguments
        frameId = requestAnimationFrame(() => animateDrawing(canvas, startTime, connections));
    } else {
        // console.log("Animation complete.");
    }
    return frameId; // Return the frameId for cancellation tracking
};


// --- ContextualPanel Component ---
function ContextualPanel({
    data,
    onClose,
    className = '',
    // Navigation Props
    onNavigatePrev,
    onNavigateNext,
    currentIndex,
    totalItems
}) {
    const canvasRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const pointsRef = useRef([]);
    const connectionsRef = useRef([]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') {
                onNavigatePrev();
            } else if (event.key === 'ArrowRight') {
                onNavigateNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onNavigatePrev, onNavigateNext]);

    // --- Function to Setup Points and Connections ---
    // Wrapped in useCallback to keep its identity stable unless dependencies change (none here)
    const setupDrawingData = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;

        const width = rect.width;
        const height = rect.height;

        // 1. Generate Points
        const newPoints = [];
        for (let i = 0; i < NUM_POINTS; i++) {
            newPoints.push({
                x: Math.random() * (width + 40) - 20,
                y: Math.random() * (height + 40) - 20
            });
        }
        pointsRef.current = newPoints;

        // 2. Calculate Connections
        const newConnections = [];
        for (let i = 0; i < newPoints.length; i++) {
            for (let j = i + 1; j < newPoints.length; j++) {
                const p1 = newPoints[i]; const p2 = newPoints[j];
                const dx = p1.x - p2.x; const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < CONNECTION_RADIUS) {
                    newConnections.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
                }
            }
        }
        // Optionally shuffle connections for more random drawing order
        // newConnections.sort(() => Math.random() - 0.5);
        connectionsRef.current = newConnections;
        // console.log(`Setup complete: ${pointsRef.current.length} points, ${connectionsRef.current.length} connections`);
        return true; // Indicate success
    }, []); // Empty dependency array - calculation based on current canvas size

    // --- Effect to Setup Canvas, Points, Connections and Start Animation ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        // Cancel any previous animation frame on re-run (if data changes)
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        let setupSuccess = false;
        let retryTimeoutId = null; // To clear potential retry timeout

        const trySetupAndAnimate = () => {
             // 1. Ensure canvas buffer is sized correctly & canvas is clear
             const contextReady = drawGenerativeLines(canvas); // Returns true if context/dims OK

             if (!contextReady) {
                  console.warn("Setup attempt failed: Canvas not ready (zero dimensions?). Retrying...");
                  // Schedule a retry if setup failed (e.g., dimensions were 0)
                  retryTimeoutId = setTimeout(trySetupAndAnimate, 150); // Increased retry delay
                  return; // Exit this attempt
             }

             // 2. Setup points and connections based on current dimensions
             setupSuccess = setupDrawingData();

             if (setupSuccess) {
                 // 3. Start the animation loop
                 const startTime = performance.now();
                 animationFrameIdRef.current = requestAnimationFrame(() => {
                      // Pass calculated connections to the animation function
                      // Store the returned frameId for cancellation
                      animationFrameIdRef.current = animateDrawing(canvas, startTime, connectionsRef.current);
                 });
             } else {
                 // This case should be less likely now due to contextReady check
                  console.error("Setup failed unexpectedly after canvas context was ready.");
             }
        }

        // Initial attempt to setup and animate
        // Use a small timeout to allow panel animation to start
        const initialTimeoutId = setTimeout(trySetupAndAnimate, 50);


        // Debounced resize handler
        const handleResize = debounce(() => {
            if(canvasRef.current) {
                // console.log("Resizing canvas and restarting animation...");
                // Cancel existing animation
                if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
                // Ensure buffer is resized/cleared
                const contextReady = drawGenerativeLines(canvasRef.current);
                if (contextReady) {
                    // Recalculate points/connections
                    if (setupDrawingData()) {
                        // Restart animation
                        const startTime = performance.now();
                        animationFrameIdRef.current = requestAnimationFrame(() => {
                             animationFrameIdRef.current = animateDrawing(canvasRef.current, startTime, connectionsRef.current);
                        });
                    }
                }
            }
        }, 250);
        window.addEventListener('resize', handleResize);

        // Cleanup function for the effect
        return () => {
            // console.log(`Cleaning up canvas effect for data ID: ${data?.id}`);
            clearTimeout(initialTimeoutId); // Clear initial setup timeout
            clearTimeout(retryTimeoutId);   // Clear any pending retry timeout
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); // Cancel animation frame
            window.removeEventListener('resize', handleResize); // Remove listener
            handleResize.cancel(); // Cancel pending debounced calls
        };
    // Rerun effect if the data prop changes, triggering a new pattern/animation
    }, [data, setupDrawingData]); // Dependency array includes data


    // --- Effect to prevent body scroll ---
    useEffect(() => {
        const originalStyle = document.body.style.overflow; // Store original style
        document.body.style.overflow = 'hidden';
        // Return cleanup function to restore original scroll style
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []); // Run only once on mount

    // Don't render the panel if no data is provided
    if (!data) return null;

    // --- Helper function to render content ---
    // (Assuming this function is correct from previous steps)
    const renderContent = () => {
        return (
            <>
                <Text type="metadata" className={styles.panelType}>{data.type?.charAt(0).toUpperCase() + data.type?.slice(1) || 'Item'}{data.date ? ` - ${data.date}` : ''}{data.startDate ? ` - ${data.startDate}${data.endDate && data.endDate !== 'Present' ? ` to ${data.endDate}` : ''}${data.endDate === 'Present' ? ` to Present` : ''}` : ''}</Text>
                {data.institution && <Text type="caption" className={styles.panelInstitution}>{data.institution}</Text>}
                {data.publisher && <Text type="caption" className={styles.panelPublisher}>{data.publisher}</Text>}
                {data.venue && <Text type="caption" className={styles.panelVenue}>Venue: {data.venue}</Text>}
                <Text type="body" className={styles.panelDescription}>{data.description || data.title || 'No further details available.'}</Text>
                {Array.isArray(data.disciplines) && data.disciplines.length > 0 && (<div className={styles.panelTags}>{data.disciplines.map((tag, index) => (<span key={`${data.id}-tag-${index}`} className={styles.panelTag}>{tag}</span>))}</div>)}
            </>
        );
    };

    // Combine base CSS module class with any external class names passed via props
    const combinedClassName = `${styles.contextualPanel} ${className}`;

    // JSX structure for the panel
    return (
        <div className={styles.panelOverlay}>
            <aside className={combinedClassName} aria-labelledby="contextual-panel-title" aria-modal="true" role="dialog" onClick={(e) => e.stopPropagation()} >
                {/* Canvas for background */}
                <canvas ref={canvasRef} className={styles.generativeBackground} aria-hidden="true" />

                {/* Header */}
                <div className={styles.panelHeader}>
                    <Heading level={3} id="contextual-panel-title" className={styles.panelTitle}>{data.title || 'Details'}</Heading>
                    <button onClick={onClose} className={styles.closeButton} aria-label="Close details panel"><Icon name="X" size={20} /></button>
                </div>

                {/* Body */}
                <div className={styles.panelBody}>{renderContent()}</div>

                {/* Footer */}
                <div className={styles.panelFooter}>
                    {/* Existing Buttons */}
                    <div className={styles.footerActions}>
                        {(data.type === 'project' || data.type === 'publication') && (<Button variant="secondary" size="small">View Full Details</Button>)}
                        {data.url && data.type !== 'project' && (<Button variant="secondary" size="small" href={data.url} target="_blank" rel="noopener noreferrer">View Source <Icon name="ExternalLink" size={14} style={{marginLeft: '6px'}}/></Button>)}
                    </div>

                    {/* Navigation Controls */}
                    {totalItems > 1 && ( // Only show navigation if there's more than one item
                        <div className={styles.footerNavigation}>
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={onNavigatePrev}
                                disabled={currentIndex === 0} // Disable if first item
                                aria-label="Previous item"
                            >
                                <Icon name="ChevronLeft" size={16} />
                            </Button>
                            <Text type="caption" className={styles.navCounter}>{currentIndex + 1} / {totalItems}</Text>
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={onNavigateNext}
                                disabled={currentIndex === totalItems - 1} // Disable if last item
                                aria-label="Next item"
                            >
                                <Icon name="ChevronRight" size={16} />
                            </Button>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

// Export the component
export default ContextualPanel;
