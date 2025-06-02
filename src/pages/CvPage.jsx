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

      <section className={cvStyles.cvSection}>
        <Heading level={2} className={cvStyles.cvSectionTitle}>Education</Heading>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>M.S. Data Science & Policy</Heading>
           <Heading level={4} className={cvStyles.cvMinorsTitle}>Concentration: Statistical Methods</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Johns Hopkins University | Baltimore, MD | 2023 – 2024</Text>
         </div>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>B.S. Economics & Statistics</Heading>
           <Heading level={3} className={cvStyles.cvEntryTitle}>B.A. Political Science</Heading>
           <Heading level={4} className={cvStyles.cvMinorsTitle}>Minor: Hispanic Languages and Literature</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | Pittsburgh, PA | 2016 – 2020</Text>
         </div>
         {/* Add more education entries */}
      </section>

      

       <section className={cvStyles.cvSection}>
        <Heading level={2} className={cvStyles.cvSectionTitle}>Work Experience</Heading>
        <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Senior Data Scientist | Education Funding Equity Initiative</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>New America | 2023 – Present</Text>
           <ul className={cvStyles.cvEntryDescription}>
             <li>Translated questions and priorities from state and local advocates into rigorous, policy-relevant research projects focused on school finance equity and integration.</li>
             <li>Designed and implemented a national interactive mapping tool to highlight the most segregating school district borders in the U.S., combining geospatial data with community narratives.</li>
             <li>Developed and maintained scalable database infrastructure to manage and analyze large datasets spanning education, housing, and demographic indicators.</li>
             <li>Led cross-program collaborations within New America to integrate research on migrant students and English learners into broader education equity work.</li>
             <li>Advised partner organizations and internal stakeholders on methodological design and data communication to ensure that research outputs were both actionable and accessible.</li>
           </ul>

         </div>

         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Board of Executive Directors</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Inter-American Development Bank | 2020 – 2023</Text>
           <ul className={cvStyles.cvEntryDescription}>
             <li>Served as liaison between the Office of the Chief Economist and the Board of Executive Directors, translating executive-level questions into targeted research analyses.</li>
             <li>Synthesized economic, social, and geopolitical data to support decision-making on country-level proposals in public health, social protection, and education infrastructure.</li>
             <li>Drafted technical briefings and strategic communications that bridged institutional research with real-time board deliberations.</li>
             <li>Strengthened internal and external communication workflows to ensure timely and clear engagement with government ministries, academic institutions, and private sector partners.</li>
           </ul>

         </div>
        
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Department of Poltical Science</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | Supervisor: Dr. Scott Morgenstern | 2017 – 2019</Text>
           <ul className={cvStyles.cvEntryDescription}>
             <li>(Placeholder: Describe responsibilities, projects, skills used, e.g., Developed agent-based models... Analyzed spatial datasets...)</li>
           </ul>

         </div>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant, Department of Environmental Science</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | Supervisor: Dr. Joe Werne | 2017 – 2019</Text>
           <ul className={cvStyles.cvEntryDescription}>
             <li>Administered statistical analysis and contributed to field work, collecting samples from India and Peru.</li>
             <li>Designed and scripted predictive algorithm to model monsoon periodicity in Southeast Asia.</li>
           </ul>

         </div>

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
        <Heading level={2} className={cvStyles.cvSectionTitle}>Awards and Scholarships</Heading>
        <ul className={cvStyles.cvSkillsList}>
        <li><Text type="body"><b>4th place:</b> United States Geography Olympiad, 2016</Text></li>
          <li><Text type="body"><b>1st Place:</b> Pennsylvania State History Bee, 2016</Text></li>
          <li><Text type="body">University of Pittsburgh Study Abroad Scholar</Text></li>
         </ul>
      </section>  

       <section className={cvStyles.cvSection}>
         <Heading level={2} className={cvStyles.cvSectionTitle}>Skills</Heading>
         <ul className={cvStyles.cvSkillsList}>
          <li><Text type="body"><b>Programming:</b> Python (Pandas, GeoPandas, Scikit-learn, NetworkX, Mesa), R, SQL, JavaScript (React)</Text></li>
          <li><Text type="body"><b>Spatial Analysis:</b> GIS (ArcGIS, QGIS), Spatial Statistics, Geovisualization (Mapbox GL JS, Leaflet, D3)</Text></li>
          <li><Text type="body"><b>Data Science:</b> Machine Learning, Econometrics, Agent-Based Modeling, Network Analysis, NLP, Data Wrangling & Viz</Text></li>
          <li><Text type="body"><b>Qualitative Methods:</b> (Placeholder if applicable, e.g., Interviewing, Content Analysis)</Text></li>
          <li><Text type="body"><b>Languages:</b> English (Native), Spanish (Fluent), French (Intermediate)</Text></li>
        </ul>
        </section>



      {/* Add other CV sections as needed (Awards, Teaching, Service, etc.) */}

    </main>
  );
}

export default CVPage;
