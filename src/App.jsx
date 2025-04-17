// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsListPage from './pages/ProjectsListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import PublicationsPage from './pages/PublicationsPage';
import CvPage from './pages/CvPage';
import ContactPage from './pages/ContactPage';
import styles from './App.module.css'; 

function App() {
  return (
    // Optional: <MainLayout> wrapper here later
    <div> {/* Basic wrapper */}
      <Header /> {/* Add the fixed Header here */}
      {/* Add Navigation Component here later */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} /> {/* Route for specific projects */}
        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/cv" element={<CvPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Optional: Add a 404 Not Found route */}
      </Routes>
    </div>
  );
}
export default App;