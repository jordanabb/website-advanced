// src/components/TimelineSlider.jsx
import React from 'react';
import styles from './TimelineSlider.module.css'; // Create this CSS module

// Props expected:
// - minYear: Number (e.g., 2014)
// - maxYear: Number (e.g., 2024)
// - currentYear: Number (selected year)
// - onYearChange: Function to call when slider value changes, passing the new year number
function TimelineSlider({ minYear, maxYear, currentYear, onYearChange }) {

  const handleChange = (event) => {
    onYearChange(parseInt(event.target.value, 10)); // Convert string value to number
  };

  return (
    <div className={styles.timelineContainer}>
      <span className={styles.yearLabel}>{minYear}</span>
      <input
        type="range"
        min={minYear}
        max={maxYear}
        value={currentYear}
        onChange={handleChange}
        className={styles.slider}
        step="1" // Increment by 1 year
        aria-label="Timeline Year Selector"
      />
      <span className={styles.yearLabel}>{maxYear}</span>
      <span className={styles.currentYearDisplay}>{currentYear}</span>
    </div>
  );
}

export default TimelineSlider;