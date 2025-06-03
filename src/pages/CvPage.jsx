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
             
           </ul>

         </div>

         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Board of Executive Directors</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Inter-American Development Bank | 2020 – 2023</Text>
           <ul className={cvStyles.cvEntryDescription}>
             
           </ul>

         </div>
        
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Department of Poltical Science</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | Supervisor: Dr. Scott Morgenstern | 2017 – 2019</Text>
           <ul className={cvStyles.cvEntryDescription}>
             
           </ul>

         </div>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Department of Environmental Science</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | Supervisor: Dr. Joe Werne | 2017 – 2019</Text>
           <ul className={cvStyles.cvEntryDescription}>
            
           </ul>

         </div>

       </section>

       <section className={cvStyles.cvSection}>
         <Heading level={2} className={cvStyles.cvSectionTitle}>Publications</Heading>
         {/* List publications - could potentially use Card component if styled appropriately, or just text */}
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Z Stadler and J Abbott (2024). "Crossing the Line: Segregation and Resource Inequality between America's School Districts.". <i>New America Report</i>. <a href="https://eric.ed.gov/?id=ED650395" target="_blank" rel="noopener noreferrer"></a>
            </Text>
          </div>

       </section>

       <section className={cvStyles.cvSection}>
          <Heading level={2} className={cvStyles.cvSectionTitle}>Presentations</Heading>
           <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Crossing the Line: Segregation and Resource Inequality between America's School Districts". Presentation, ESRI User Conference, San Diego, CA. July 2025.
             </Text>
           </div>
            <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Spatial Educational Disparities: Exploring the Extent of Place-Based Inequity and Residential Segregation between Public School Districts". Paper Presentation. Urban Affairs Association (JUA) National Conference, New York, NY. April 2024.
             </Text>
           </div>
            <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "From Art to Enforcement: Amplifying your Fair Housing Message". Invited Panel, National Fair Housing Association, Washington, DC. July 2022.
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
