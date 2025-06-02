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
// Function to get the current line color based on theme
const getLineColor = () => {
    const isLightMode = document.body.classList.contains('light-mode');
    return isLightMode 
        ? "rgba(88, 166, 255, 0.25)" // More blue for light mode
        : "rgba(255, 215, 0, 0.3)";  // Gold color for dark mode
};

const LINE_WIDTH = .35;                     // Thin lines (try 1 if needed)
const NUM_POINTS = 60;                      // Number of "cell centers"
const CONNECTION_RADIUS = 200;              // Max distance to connect points
const ANIMATION_DURATION = 3000;            // Duration for lines to draw (in ms)

// Mobile performance optimizations
const isMobile = () => window.innerWidth <= 768;
const getMobileOptimizedConfig = () => {
    if (isMobile()) {
        return {
            numPoints: 30,           // Reduce points on mobile
            connectionRadius: 150,   // Reduce connection radius
            animationDuration: 2000  // Faster animation
        };
    }
    return {
        numPoints: NUM_POINTS,
        connectionRadius: CONNECTION_RADIUS,
        animationDuration: ANIMATION_DURATION
    };
};

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
    ctx.strokeStyle = getLineColor(); // Use dynamic color based on theme
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
    totalItems,
    // Arrow animation props
    onProjectHover,
    onProjectLeave,
    onDescriptionHover
}) {
    const canvasRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const pointsRef = useRef([]);
    const connectionsRef = useRef([]);
    
    // Touch/swipe handling refs
    const touchStartRef = useRef(null);
    const touchStartTimeRef = useRef(null);
    const panelRef = useRef(null);
    
    // Drag resize handling refs
    const isDraggingRef = useRef(false);
    const dragStartYRef = useRef(null);
    const initialHeightRef = useRef(null);
    const [panelHeight, setPanelHeight] = useState(null);
    const rafIdRef = useRef(null);
    const lastUpdateTimeRef = useRef(0);

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

    // Drag handle event handlers
    const handleDragStart = useCallback((e) => {
        if (!isMobile()) return; // Only enable on mobile
        
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = true;
        
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        dragStartYRef.current = clientY;
        
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            initialHeightRef.current = rect.height;
        }
        
        document.body.style.userSelect = 'none';
    }, []);

    const handleDragMove = useCallback((e) => {
        if (!isDraggingRef.current || !isMobile()) return;
        
        e.preventDefault();
        
        // Throttle updates using requestAnimationFrame
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }
        
        rafIdRef.current = requestAnimationFrame(() => {
            const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
            const deltaY = dragStartYRef.current - clientY; // Inverted because we're dragging from top
            const newHeight = initialHeightRef.current + deltaY;
            
            // Get viewport height and calculate constraints
            const vh = window.innerHeight;
            const minHeight = vh * 0.3; // 30vh minimum
            const maxHeight = vh * 0.8; // 80vh maximum
            
            // Clamp the height within bounds
            const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
            const heightVh = (clampedHeight / vh) * 100;
            
            // Only update if there's a meaningful change (reduce unnecessary re-renders)
            const currentTime = performance.now();
            if (currentTime - lastUpdateTimeRef.current > 8) { // ~120fps throttle
                setPanelHeight(`${heightVh}vh`);
                lastUpdateTimeRef.current = currentTime;
            }
        });
    }, []);

    const handleDragEnd = useCallback(() => {
        if (!isDraggingRef.current) return;
        
        // Cancel any pending animation frame
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        
        isDraggingRef.current = false;
        dragStartYRef.current = null;
        initialHeightRef.current = null;
        document.body.style.userSelect = '';
    }, []);

    // Set up drag event listeners - always listen, check dragging state in handlers
    useEffect(() => {
        const handleMouseMove = (e) => handleDragMove(e);
        const handleMouseUp = () => handleDragEnd();
        const handleTouchMove = (e) => handleDragMove(e);
        const handleTouchEnd = () => handleDragEnd();

        // Always add listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleDragMove, handleDragEnd]);

    // Touch event handlers for swipe gestures (modified to work with drag)
    const handleTouchStart = useCallback((e) => {
        // Check if touch started on drag handle
        const target = e.target.closest(`.${styles.dragHandle}`);
        if (target) {
            handleDragStart(e);
            return;
        }
        
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY
        };
        touchStartTimeRef.current = Date.now();
    }, [handleDragStart]);

    const handleTouchEnd = useCallback((e) => {
        // If we were dragging, handle drag end
        if (isDraggingRef.current) {
            handleDragEnd();
            return;
        }
        
        if (!touchStartRef.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartTimeRef.current;

        // Swipe thresholds
        const minSwipeDistance = 50;
        const maxSwipeTime = 300;
        const maxVerticalDeviation = 100;

        // Check for horizontal swipe (navigation between entries)
        if (Math.abs(deltaX) > minSwipeDistance && 
            Math.abs(deltaY) < maxVerticalDeviation && 
            deltaTime < maxSwipeTime) {
            
            if (deltaX > 0) {
                // Swipe right - go to previous
                onNavigatePrev();
            } else {
                // Swipe left - go to next
                onNavigateNext();
            }
        }
        
        // Check for vertical swipe down (close panel)
        else if (deltaY > minSwipeDistance && 
                 Math.abs(deltaX) < maxVerticalDeviation && 
                 deltaTime < maxSwipeTime) {
            onClose();
        }

        // Reset touch tracking
        touchStartRef.current = null;
        touchStartTimeRef.current = null;
    }, [onNavigatePrev, onNavigateNext, onClose, handleDragEnd]);

    // --- Function to Setup Points and Connections ---
    // Wrapped in useCallback to keep its identity stable unless dependencies change (none here)
    const setupDrawingData = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;

        const width = rect.width;
        const height = rect.height;
        
        // Get mobile-optimized configuration
        const config = getMobileOptimizedConfig();

        // 1. Generate Points
        const newPoints = [];
        for (let i = 0; i < config.numPoints; i++) {
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
                if (distance < config.connectionRadius) {
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

        // Theme change handler - restart animation with new colors
        const handleThemeChange = () => {
            if(canvasRef.current && connectionsRef.current.length > 0) {
                // Cancel existing animation
                if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
                // Restart animation with new theme colors
                const startTime = performance.now();
                animationFrameIdRef.current = requestAnimationFrame(() => {
                     animationFrameIdRef.current = animateDrawing(canvasRef.current, startTime, connectionsRef.current);
                });
            }
        };
        document.addEventListener('themeChanged', handleThemeChange);

        // Cleanup function for the effect
        return () => {
            // console.log(`Cleaning up canvas effect for data ID: ${data?.id}`);
            clearTimeout(initialTimeoutId); // Clear initial setup timeout
            clearTimeout(retryTimeoutId);   // Clear any pending retry timeout
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); // Cancel animation frame
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); // Cancel drag animation frame
            window.removeEventListener('resize', handleResize); // Remove listener
            document.removeEventListener('themeChanged', handleThemeChange); // Remove theme listener
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
                <Text 
                    type="body" 
                    className={styles.panelDescription}
                    onMouseEnter={onDescriptionHover}
                >
                    {data.description || data.title || 'No further details available.'}
                </Text>
                {Array.isArray(data.disciplines) && data.disciplines.length > 0 && (<div className={styles.panelTags}>{data.disciplines.map((tag, index) => (<span key={`${data.id}-tag-${index}`} className={styles.panelTag}>{tag}</span>))}</div>)}
                
                {/* Thesis Section for Education Items */}
                {data.type === 'education' && data.thesis && (
                    <div className={styles.thesisSection}>
                        <Heading level={4} className={styles.thesisHeading}>Thesis</Heading>
                        <div className={styles.thesisDetails}>
                            <Text type="body-bold" className={styles.thesisTitle}>{data.thesis.title}</Text>
                            {data.thesis.advisor && (
                                <Text type="caption" className={styles.thesisAdvisor}>Advisor: {data.thesis.advisor}</Text>
                            )}
                        </div>
                    </div>
                )}

                {/* Projects Section for Work Items */}
                {data.type === 'work' && Array.isArray(data.projects) && data.projects.length > 0 && (
                    <div className={styles.projectsSection}>
                        <Heading level={4} className={styles.projectsHeading}>Associated Projects</Heading>
                        <div className={styles.projectsList}>
                            {data.projects.map((project, index) => {
                                // Check if this project has case study locations
                                const hasArrows = project.caseStudyLocations && project.caseStudyLocations.length > 0;
                                
                                const handleProjectHover = () => {
                                    if (hasArrows && onProjectHover) {
                                        // Pass the project and the source coordinates (the work location)
                                        onProjectHover(project, [data.lon, data.lat]);
                                    } else if (!hasArrows && onDescriptionHover) {
                                        // For projects without case study data, return to work node extent
                                        onDescriptionHover();
                                    }
                                };
                                
                                const handleProjectLeave = () => {
                                    if (hasArrows && onProjectLeave) {
                                        onProjectLeave();
                                    }
                                    // No special leave behavior needed for projects without arrows
                                    // as resetMapToWorkNode is a one-time action
                                };
                                
                                return (
                                    <div 
                                        key={`${data.id}-project-${index}`} 
                                        className={`${styles.projectItem} ${project.url ? styles.clickable : ''} ${hasArrows ? styles.hasArrows : ''}`}
                                        onMouseEnter={handleProjectHover}
                                        onMouseLeave={handleProjectLeave}
                                    >
                                        <div className={styles.projectHeader}>
                                            {project.url ? (
                                                <a href={project.url} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                                                    <Text type="body-bold" className={styles.projectTitle}>{project.title}</Text>
                                                </a>
                                            ) : (
                                                <Text type="body-bold" className={styles.projectTitle}>{project.title}</Text>
                                            )}
                                            <Text type="caption" className={styles.projectTiming}>
                                                {project.status && project.status.toLowerCase() !== 'completed' && `${project.status} `}
                                                {project.startDate}{project.endDate && project.endDate !== 'Present' ? ` - ${project.endDate}` : project.endDate === 'Present' ? ' - Present' : ''}
                                            </Text>
                                        </div>
                                        <Text type="body" className={styles.projectDescription}>{project.description}</Text>
                                        {hasArrows && (
                                            <Text type="caption" className={styles.arrowHint}>Hover to see case study locations</Text>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </>
        );
    };

    // Combine base CSS module class with any external class names passed via props
    const combinedClassName = `${styles.contextualPanel} ${className}`;
    
    // Apply dynamic height if set by dragging
    const panelStyle = panelHeight ? { height: panelHeight } : {};

    // JSX structure for the panel
    return (
        <div className={styles.panelOverlay}>
            <aside 
                ref={panelRef}
                className={combinedClassName} 
                style={panelStyle}
                aria-labelledby="contextual-panel-title" 
                aria-modal="true" 
                role="dialog" 
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Drag handle for mobile resizing */}
                <div 
                    className={styles.dragHandle}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    aria-label="Drag to resize panel"
                />
                
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
