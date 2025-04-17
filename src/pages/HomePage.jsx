// src/pages/HomePage.jsx
import React from 'react';
import SpatialResumeMap from '../components/SpatialResumeMap';
// Optional: Add some basic styling if using CSS Modules for HomePage
// import styles from './HomePage.module.css';

function HomePage() {
  return (
    // Use a wrapper div if you want to style the page layout
    <div>

      {/* Example Content Below Map */}
      <div style={{ padding: '20px', color: '#CDD9E5' }}>

      </div>
      <SpatialResumeMap />
    </div>
  );
}

export default HomePage;