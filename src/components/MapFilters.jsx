// src/components/MapFilters.jsx
import React from 'react';
import styles from './MapFilters.module.css'; // Create this CSS module

// Define the types we want to filter by (match data types in JSON)
const filterTypes = ['education', 'work', 'publication', 'conference'];
// Optional: Define colors for consistency (match node colors)
const typeColors = {
    education: '#F0B917',
    work: '#3FB950',
    publication: '#58A6FF',
    conference: '#A371F7'
};

// Define display labels for filter types
const typeLabels = {
    education: 'Education',
    work: 'Work',
    publication: 'Publication',
    conference: 'Presentation'
};


// Props expected:
// - activeFilters: An array of currently active type strings (e.g., ['project', 'publication'])
// - onFilterChange: Function to call when a filter button is clicked, passing the type string
function MapFilters({ activeFilters, onFilterChange }) {
    return (
        <div className={styles.filterContainer}>
            {/* <span className={styles.filterLabel}>Filter by Type:</span> */}
            {filterTypes.map((type) => {
                const isActive = activeFilters.includes(type);
                // Dynamically create style for border/background based on active state and type color
                const buttonStyle = {
                    borderColor: typeColors[type] || 'var(--color-text-secondary)', // Use type color for border
                    backgroundColor: isActive ? `${typeColors[type] || 'var(--color-text-secondary)'}33` : 'transparent', // Slight transparent fill if active (e.g., 33 = 20% opacity hex)
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-primary)', // Use primary text color for both states
                };
                return (
                    <button
                        key={type}
                        className={`${styles.filterButton} ${isActive ? styles.active : ''}`}
                        onClick={() => onFilterChange(type)}
                        style={buttonStyle} // Apply dynamic style
                        aria-pressed={isActive} // Accessibility
                    >
                        {/* Use custom label mapping */}
                        {typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                );
            })}
        </div>
    );
}

export default MapFilters;
