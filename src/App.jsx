// src/App.jsx

import React from 'react';
import {
  // No Router import needed here if it's in main.jsx
  Routes,
  Route,
  Link
} from 'react-router-dom';

// Import your page components
import SpatialResumeMap from './components/SpatialResumeMap';
import AboutPage from './pages/AboutPage';
import CVPage from './pages/CvPage'; // Corrected case
import ContactPage from './pages/ContactPage';
import ResearchPage from './pages/ResearchPage';
import SoftwarePage from './pages/SoftwarePage';

// Import your Header component
import Header from './components/Header'; // Corrected casing

// Optional: Import global styles
import './App.module.css'; // Or your global CSS entry point

function App() {
  return (
    // Use a Fragment or div, NOT <Router> here
    <>
      {/* Render your Header component */}
      <Header />

      {/* Main Content Area */}
      <main> {/* Optional semantic wrapper */}
          <Routes>
            {/* Routes are defined inside the component that is wrapped by the Router */}
            <Route path="/" element={<SpatialResumeMap />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/cv" element={<CVPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/software" element={<SoftwarePage />} />
            <Route path="*" element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>404 Not Found</h2>
                <Link to="/" style={{ color: '#58A6FF' }}>Go Home</Link>
              </div>
            } />
          </Routes>
      </main>

      {/* Optional: Footer Component */}
      {/* <footer> Your Footer Content Here </footer> */}

    </> // End Fragment or div
  );
}

export default App;
