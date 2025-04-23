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
              (Placeholder for a compelling narrative - approx. 300-500 words.
              Introduce yourself, your interdisciplinary journey combining Sociology,
              Policy, Computer Science, Data Science, and Geography. Highlight your
              core research focus on municipal governance structures and their role
              in creating/reinforcing spatial and educational inequity.)
            </Text>
            <Text type="body">
              (Continue the narrative. Elaborate on your methodological approach,
              emphasizing computational social science techniques like spatial analysis,
              modeling, and data integration. Briefly mention your forward-looking
              vision and research goals, aligning with the 'visionary thinker'
              and collaborator attraction goals.)
            </Text>
            {/* Optional: Link to CV or Contact */}
            {/* <Button href="/cv" variant="secondary">View CV</Button> */}
        </div>
      </div>


    </main>
  );
}

export default AboutPage;