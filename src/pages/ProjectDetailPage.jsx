import React from 'react';
import { useParams } from 'react-router-dom'; // Import hook to get project ID

function ProjectDetailPage() {
  // Get the projectId from the URL (defined in App.jsx route: /projects/:projectId)
  let { projectId } = useParams();

  return (
    <div>
      <h1>Project Detail Page</h1>
      <p>Details for project ID: {projectId}</p>
      {/* Detailed project content, code snippets, visuals will go here */}
    </div>
  );
}

export default ProjectDetailPage;