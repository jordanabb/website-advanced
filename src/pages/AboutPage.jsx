import React from 'react';
import { Heading, Text } from '../components/ui/Typography/Typography';
import Button from '../components/ui/Button/Button';
import Icon from '../components/ui/Icon/Icon';
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
            src="/headshot.jpg" // Make sure this path is correct
            alt="Headshot of Jordan Abbott"
            className={aboutStyles.headshot}
          />
          {/* START: Professional Social Links */}
          <div className={aboutStyles.socialLinks}>
            <Button
              href="https://www.newamerica.org/our-people/jordan-abbott/" // <-- Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              variant="social"
              size="medium"
              className={aboutStyles.socialButton}
            >
              <Icon name="Building2" size={18} />
              New America Bio
            </Button>
            <Button
              href="https://github.com/jordanabb/" // <-- Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              variant="social"
              size="medium"
              className={aboutStyles.socialButton}
            >
              <Icon name="Github" size={18} />
              GitHub
            </Button>
            <Button
              href="https://www.linkedin.com/in/jordan-abbott-idb/" // <-- Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              variant="social"
              size="medium"
              className={aboutStyles.socialButton}
            >
              <Icon name="Linkedin" size={18} />
              LinkedIn
            </Button>
            <Button
              href="https://scholar.google.com/citations?user=6FYYVt8AAAAJ&hl=en" // <-- Replace with your actual link
              target="_blank"
              rel="noopener noreferrer"
              variant="social"
              size="medium"
              className={aboutStyles.socialButton}
            >
              <Icon name="GraduationCap" size={18} />
              Google Scholar
            </Button>
          </div>
          {/* END: Professional Social Links */}
        </div>
        <div className={aboutStyles.aboutText}>
            <Text type="body">
              I am Jordan Abbott, Senior Data Scientist at the Education Funding Equity Initiative at New America. My work sits at the intersection of data science, education policy, sociology, and geography, with a focus on how municipal governance structures and policies shape spatial and educational inequities.
            </Text>
            
            <Text type="body">
              My current research involves developing algorithmic redistricting models to understand and evaluate the role of district boundaries in shaping educational opportunities. These models draw on advanced spatial and computational methods to test how redrawing school district lines could impact resource allocation and school integration. By simulating alternative scenarios, I aim to inform efforts to promote equity and challenge entrenched patterns of segregation.
            </Text>

            <Text type="body">
              I strive to complement my research with interactive, data-driven tools that communicate findings clearly and effectively to diverse audiences. My work leverages web-based data visualizations, interactive mapping tools, and custom applications to ensure that insights are not just buried in technical reports, but shared in ways that inform policymakers, empower stakeholders, and amplify community voices.
            </Text>

            <Text type="body">
              I approach all of my work through a computational social science lens, integrating econometric modeling and causal inference with geospatial analysis and agent-based modeling. I use complex, large-scale data sources to build a clearer picture of how these systems interact and produce real disparities in people’s lives 
            </Text>

            <Text type="body">
              In my anticipated doctoral research, I plan to continue this line of inquiry, investigating how municipal governance systems – encompassing school finance formulas, zoning regulations, tax structures, and housing affordability mandates – differentially impact opportunities and outcomes across diverse communities. Ultimately, my goal is to produce work that is not only analytically rigorous, but also practically useful and meaningfully engaged with those striving for greater equity in their communities.
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
