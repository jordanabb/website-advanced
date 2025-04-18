// src/components/MapFilters.jsx
import React from 'react';
import styles from './MapFilters.module.css'; // Create this CSS module

// Define the types we want to filter by (match data types in JSON)
const filterTypes = ['education', 'project', 'publication', 'conference'];
// Optional: Define colors for consistency (match node colors)
const typeColors = {
    education: '#F0B917',
    project: '#58A6FF',
    publication: '#58A6FF',
    conference: '#F0B917'
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
                    borderColor: typeColors[type] || '#7D8590', // Use type color for border
                    backgroundColor: isActive ? `${typeColors[type] || '#7D8590'}33` : 'transparent', // Slight transparent fill if active (e.g., 33 = 20% opacity hex)
                    color: isActive ? '#CDD9E5' : '#7D8590', // Brighter text if active
                };
                return (
                    <button
                        key={type}
                        className={`${styles.filterButton} ${isActive ? styles.active : ''}`}
                        onClick={() => onFilterChange(type)}
                        style={buttonStyle} // Apply dynamic style
                        aria-pressed={isActive} // Accessibility
                    >
                        {/* Capitalize first letter for display */}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                );
            })}
        </div>
    );
}

export default MapFilters;