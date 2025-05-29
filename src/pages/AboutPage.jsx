import React from 'react';
import { Heading, Text } from '../components/ui/Typography/Typography';
import styles from './PageLayout.module.css'; 
import aboutStyles from './AboutPage.module.css';

function AboutPage() {
  return (
    <main className={styles.mainContent}>
      <div className={styles.pageHeader}>
        <Heading level={1} className={styles.pageTitle}>About Me</Heading>
      </div>

      <div className={aboutStyles.aboutLayout}>
        <div className={aboutStyles.headshotContainer}>
           <img
             src="/headshot.jpg"
             alt="Headshot of Jordan Abbott"
             className={aboutStyles.headshot}
           />
        </div>
        <div className={aboutStyles.aboutText}>
            <Text type="body">
            I am Jordan Abbott, Senior Data Scientist for the Education Funding Equity Initiative at New America. My work lies at the intersection of Computer Science, Data Science, Education Policy, Sociology, and Geography. My research confronts a critical challenge: how the very structures of our cities and municipalities—their governance, policies, and resource allocation—create and perpetuate spatial and educational inequities.
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
        </div>
      </div>
    </main>
  );
}

export default AboutPage;
