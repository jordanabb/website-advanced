import React from 'react';
// Assuming UI components are in ../components/ui/ - ADJUST PATHS AS NEEDED
import { Heading, Text } from '../components/ui/Typography/Typography';
// import Icon from '../components/ui/Icon/Icon'; // Import if needed for links here
// import Button from '../components/ui/Button/Button'; // Import if needed for links here
import styles from './PageLayout.module.css'; 

// Placeholder for the image path - replace with your actual image later
const headshotPlaceholder = '/path/to/your/headshot.jpg'; // Or import if using build process

function AboutPage() {
  return (
    <main className={styles.mainContent}> {/* Optional: Use a common layout class */}
      <Heading level={1}>About Me</Heading>

      {/* Consider a simple layout for text and image */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: '250px' }}> {/* Image container */}
           {/* Basic Image Placeholder - Style as needed */}
           <img
             src={headshotPlaceholder}
             alt="Headshot of [Your Name]" // Replace with your name
             style={{
               maxWidth: '100%',
               height: 'auto',
               borderRadius: '6px', // Example style
               border: '1px solid #30363D' // Example style
             }}
           />
        </div>
        <div style={{ flex: '2 1 400px' }}> {/* Text container */}
            <Text type="body">
            I am Jordan Abbott, a PhD Candidate in Computational Social Science at Stanford University, working at the intersection of Computer Science, Data Science, Education Policy, Sociology, and Geography. My research confronts a critical challenge: how the very structures of our cities and municipalities—their governance, policies, and resource allocation—create and perpetuate spatial and educational inequities.


            </Text>
            <Text type="body">
            Traditional approaches often examine these issues within disciplinary silos. However, the complex interplay between housing policy, school funding mechanisms, demographic shifts, and historical geographic patterns demands a more integrated perspective. I bridge this gap by leveraging the power of computational methods to analyze social processes at scale and across space. My work combines the theoretical grounding and contextual understanding from sociology and policy analysis with the rigorous techniques of data science and spatial computing.

            </Text>

            <Text type="body">
            Specifically, my doctoral research investigates how local municipal governance – encompassing school finance formulas, zoning regulations, tax structures, and housing affordability mandates – differentially impacts opportunities and outcomes across diverse communities. I utilize methods ranging from econometric modeling and causal inference to geospatial analysis (GIS) and agent-based modeling to simulate urban dynamics and policy effects. By integrating large-scale administrative data, census records, and spatial datasets, I aim to uncover the often hidden mechanisms that link policy decisions to tangible inequalities on the ground.

</Text>

<Text type="body">
This computational social science approach allows not only for a deeper diagnosis of spatial inequity but also for exploring the potential impacts of alternative policy scenarios. My goal is to produce research that is both analytically rigorous and relevant for policymakers and communities striving for greater equity.

</Text>

<Text type="body">
I am passionate about collaborating with researchers across disciplines who share an interest in urban studies, computational methods, and social justice. If my work resonates with you, please feel free to connect.

</Text>
            {/* Optional: Link to CV or Contact */}
            {/* <Button href="/cv" variant="secondary">View CV</Button> */}
        </div>
      </div>


    </main>
  );
}

export default AboutPage;