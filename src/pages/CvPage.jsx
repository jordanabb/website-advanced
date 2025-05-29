import React from 'react';
// ADJUST PATHS AS NEEDED
import { Heading, Text } from '../components/ui/Typography/Typography';
import Button from '../components/ui/Button/Button';
import Icon from '../components/ui/Icon/Icon';
import styles from './PageLayout.module.css'; // Optional: Common page layout
import cvStyles from './CvPage.module.css'; // Specific styles for CV layout

// Placeholder for the actual PDF file path
const cvPdfPath = '/path/to/your/CV.pdf';

function CVPage() {
  return (
    <main className={styles.mainContent}>
      <div className={styles.pageHeader}>
        <Heading level={1} className={styles.pageTitle}>Curriculum Vitae</Heading>
        <Button
          href={cvPdfPath}
          download
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="medium"
          className={cvStyles.downloadButton}
        >
          <Icon name="Download" size={18} style={{ marginRight: '8px' }} />
          Download PDF
        </Button>
      </div>

      {/* --- CV Content Sections --- */}
      {/* Use semantic structure and UI components */}
      {/* Wrap sections for potential styling */}

      <section className={cvStyles.cvSection}>
        <Heading level={2} className={cvStyles.cvSectionTitle}>Education</Heading>
        <div className={cvStyles.cvEntry}>
          <Heading level={3} className={cvStyles.cvEntryTitle}>PhD Candidate, Computational Social Science</Heading>
          <Text type="metadata" className={cvStyles.cvEntryMeta}>Stanford University | Stanford, CA | 2020 – Present</Text>
          <Text type="body" className={cvStyles.cvEntryDescription}>(Brief description of dissertation topic/focus, advisor if desired)</Text>
        </div>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>M.S. Public Policy & Data Science</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>New York University | New York, NY | 2018 – 2020</Text>
         </div>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>B.A. Sociology & Urban Studies</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Chicago | Chicago, IL | 2014 – 2018</Text>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Summer Institute: GIS for Social Scientists | University of British Columbia | 2019</Text>
         </div>
         {/* Add more education entries */}
      </section>

       <section className={cvStyles.cvSection}>
        <Heading level={2} className={cvStyles.cvSectionTitle}>Research Experience</Heading>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Graduate Research Assistant</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Stanford University | Supervisor: [Supervisor Name] | 2020 – Present</Text>
           <Text type="body" className={cvStyles.cvEntryDescription}>- (Placeholder: Describe responsibilities, projects, skills used, e.g., Developed agent-based models... Analyzed spatial datasets...)</Text>
           <Text type="body" className={cvStyles.cvEntryDescription}>- (Placeholder: Add more bullet points)</Text>
         </div>
         {/* Add more experience entries */}
       </section>

       <section className={cvStyles.cvSection}>
         <Heading level={2} className={cvStyles.cvSectionTitle}>Publications</Heading>
         {/* List publications - could potentially use Card component if styled appropriately, or just text */}
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Your Name, Co-author 1, Co-author 2. (2023). "Spatial Mismatches: Zoning Laws and Educational Opportunity". <i>Journal of Urban Affairs</i>. <a href="https://doi.org/10.xxxx/xxxxxx" target="_blank" rel="noopener noreferrer">DOI: 10.xxxx/xxxxxx</a>
            </Text>
          </div>
          <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPublication}>
               Your Name. (2023). "An Agent-Based Framework for Simulating Urban Growth and Resource Equity". <i>Proceedings of the Computational Social Science Conference</i>. <a href="http://example.com/link-to-proceedings" target="_blank" rel="noopener noreferrer">[Link]</a>
             </Text>
          </div>
           <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPublication}>
               Your Name. (2022). "Computational Approaches to Measuring Spatial Inequity". <i>Annals of the American Association of Geographers</i>. <a href="https://doi.org/10.xxxx/yyyyyy" target="_blank" rel="noopener noreferrer">DOI: 10.xxxx/yyyyyy</a>
             </Text>
           </div>
         {/* Add more publications */}
       </section>

       <section className={cvStyles.cvSection}>
          <Heading level={2} className={cvStyles.cvSectionTitle}>Presentations</Heading>
           <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Fiscal Federalism and School Equity on the US-Mexico Border". Invited Talk, North American Regional Science Council (NARSC), Toronto, ON. November 2023.
             </Text>
           </div>
            <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Simulating Urban Growth and Resource Equity". Computational Social Science Conference, Chicago, IL. October 2023.
             </Text>
           </div>
            <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Housing Policy & School Funding in California". American Sociological Association Annual Meeting, Los Angeles, CA. August 2022.
             </Text>
           </div>
          {/* Add more presentations */}
        </section>

       <section className={cvStyles.cvSection}>
         <Heading level={2} className={cvStyles.cvSectionTitle}>Skills</Heading>
         <ul className={cvStyles.cvSkillsList}>
          <li><Text type="body"><b>Programming:</b> Python (Pandas, GeoPandas, Scikit-learn, NetworkX, Mesa), R, SQL, JavaScript (React)</Text></li>
          <li><Text type="body"><b>Spatial Analysis:</b> GIS (ArcGIS, QGIS), Spatial Statistics, Geovisualization (Mapbox GL JS, Leaflet, D3)</Text></li>
          <li><Text type="body"><b>Data Science:</b> Machine Learning, Econometrics, Agent-Based Modeling, Network Analysis, Data Wrangling & Viz</Text></li>
          <li><Text type="body"><b>Qualitative Methods:</b> (Placeholder if applicable, e.g., Interviewing, Content Analysis)</Text></li>
          <li><Text type="body"><b>Languages:</b> (Placeholder if applicable, e.g., English (Native), Spanish (Fluent))</Text></li>
        </ul>
        </section>

      {/* Add other CV sections as needed (Awards, Teaching, Service, etc.) */}

    </main>
  );
}

export default CVPage;
