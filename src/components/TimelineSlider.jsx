// src/components/TimelineSlider.jsx
import React, { useRef, useEffect } from 'react';
import styles from './TimelineSlider.module.css';

function TimelineSlider({
    minYear,
    maxYear,
    currentYear,
    onYearChange,
    onDragStart,
    onDragEnd,
    disabled,
    isDragging
}) {
    const sliderRef = useRef(null);
    
    // Set up drag event listeners for both mouse and touch
    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;
        
        // Common handler for starting drag operations
        const handleDragStart = () => {
            if (disabled) return;
            if (typeof onDragStart === 'function') {
                onDragStart();
            }
        };
        
        // Common handler for ending drag operations
        const handleDragEnd = () => {
            if (disabled) return;
            if (typeof onDragEnd === 'function') {
                onDragEnd();
            }
        };
        
        // Mouse events
        slider.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mouseup', handleDragEnd);
        
        // Touch events for mobile
        slider.addEventListener('touchstart', handleDragStart);
        document.addEventListener('touchend', handleDragEnd);
        
        return () => {
            slider.removeEventListener('mousedown', handleDragStart);
            document.removeEventListener('mouseup', handleDragEnd);
            slider.removeEventListener('touchstart', handleDragStart);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [disabled, onDragStart, onDragEnd]);
    
    return (
        <div className={styles.timelineContainer}>
            <span className={styles.yearLabel}>{minYear}</span>
            <input
                ref={sliderRef}
                type="range"
                min={minYear}
                max={maxYear}
                value={currentYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                disabled={disabled}
                className={styles.slider}
            />
            <span className={styles.yearLabel}>{maxYear}</span>
            <div className={styles.currentYearDisplay}>
                {currentYear}
            </div>
        </div>
    );
}

export default TimelineSlider;