import React from 'react';
// ADJUST PATHS AS NEEDED
import { Heading, Text } from '../components/ui/Typography/Typography';
import Button from '../components/ui/Button/Button';
import Icon from '../components/ui/Icon/Icon';
import styles from './PageLayout.module.css'; // Optional: Common page layout
import cvStyles from './CvPage.module.css'; // Specific styles for CV layout

// Path to the CV PDF file in the public folder
const cvPdfPath = '/Abbott_CV.pdf';

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
           <Heading level={4} className={cvStyles.cvMinorsTitle}>Concentration: Statistical Analysis</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Johns Hopkins University | 2023 – 2024</Text>
         </div>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Student Fellow</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Centro de Investigación y Docencia Económicas (CIDE) | División de Economía y Estudios Políticos | Mexico City, MX | 2019 – 2020</Text>
         </div>
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>B.S. Economics & Statistics</Heading>
           <Heading level={3} className={cvStyles.cvEntryTitle}>B.A. Political Science</Heading>
           <Heading level={4} className={cvStyles.cvMinorsTitle}>Minor: Hispanic Languages and Literature</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | 2016 – 2019</Text>
         </div>
      </section>

      

       <section className={cvStyles.cvSection}>
        <Heading level={2} className={cvStyles.cvSectionTitle}>Research & Professional Experience</Heading>
        <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Senior Data Scientist | Education Funding Equity Initiative</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>New America | Aug 2023 – Present</Text>
           <Text type="body" className={cvStyles.cvEntryNote}><i>Promoted from Data Manager (Dec 2024)</i></Text>
         </div>

         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Board of Executive Directors</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>Inter-American Development Bank | Mar 2020 – July 2023</Text>
         </div>
        
         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Department of Political Science</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | Supervisor: Dr. Scott Morgenstern | 2017 – 2019</Text>
         </div>

         <div className={cvStyles.cvEntry}>
           <Heading level={3} className={cvStyles.cvEntryTitle}>Research Assistant | Department of Environmental Science</Heading>
           <Text type="metadata" className={cvStyles.cvEntryMeta}>University of Pittsburgh | Jan 2017 – Apr 2019</Text>
         </div>

       </section>

       <section className={cvStyles.cvSection}>
         <Heading level={2} className={cvStyles.cvSectionTitle}>Publications</Heading>
         
         <Heading level={3} className={cvStyles.cvSubsectionTitle}>Peer-Reviewed Conference Proceedings</Heading>
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Abbott, J. (2025). "Optimizing Opportunity: An Algorithmic Approach to Redistricting for Fairer School Funding." <i>Proceedings of the 2025 NCME Conference on Artificial Intelligence in Measurement and Education (AIME-CON)</i>. ACL Anthology.
            </Text>
          </div>

         <Heading level={3} className={cvStyles.cvSubsectionTitle}>Policy Reports</Heading>
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Stadler, Z. & Abbott, J. (2025). "Redrawing the Lines: How Purposeful School System Redistricting Can Increase Funding Fairness and Decrease Segregation." <i>New America</i>.
            </Text>
          </div>
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Stadler, Z. & Abbott, J. (2024). "Crossing the Line: Segregation and Resource Inequality between America's School Districts." <i>New America</i>.
            </Text>
          </div>

         <Heading level={3} className={cvStyles.cvSubsectionTitle}>Selected Public Scholarship</Heading>
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Abbott, J. (2024). "When Students Get Lost in the Algorithm: The Problems with Nevada's AI School Funding Experiment." <i>New America</i>. (Quoted by <i>The New York Times</i>; Cited by Report of the U.N. Special Rapporteur on the right to education: AI in Education).
            </Text>
          </div>
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Stadler, Z. & Abbott, J. (2025). "A District-by-District Accounting of the $6.2 Billion the U.S. Department of Education Has Held Back from Schools." <i>New America</i>. (New America's most viewed publication of 2025).
            </Text>
          </div>
         <div className={cvStyles.cvEntry}>
            <Text type="body" className={cvStyles.cvPublication}>
              Abbott, J. (2025). "Inefficiency Multiplied: What Happens When Research and Data are Halted at U.S. Dept. of Ed." <i>New America</i>. (Quoted by <i>The Review of Democracy</i>).
            </Text>
          </div>

       </section>

       <section className={cvStyles.cvSection}>
          <Heading level={2} className={cvStyles.cvSectionTitle}>Presentations</Heading>
          
          <Heading level={3} className={cvStyles.cvSubsectionTitle}>Conferences</Heading>
          <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Optimizing Opportunity: An Algorithmic Approach to Redistricting for Fairer School Funding." Paper presented at NCME Conference on Artificial Intelligence in Measurement and Education (AIME-CON), Pittsburgh, PA. October 2025.
             </Text>
           </div>
           <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Crossing the Line: Segregation and Resource Inequality." Interactive Mapping Tool presented at the ESRI User Conference, San Diego, CA. July 2025.
             </Text>
           </div>
            <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Spatial Educational Disparities: Exploring the Extent of Place-Based Inequity." Paper presented at the Urban Affairs Association (UAA) National Conference, New York, NY. April 2024.
             </Text>
           </div>

          <Heading level={3} className={cvStyles.cvSubsectionTitle}>Poster Presentations</Heading>
          <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Optimizing Opportunity: An Algorithmic Approach to Redistricting for Fairer School Funding." Poster presented at the ACM Conference on Equity and Access in Algorithms, Mechanisms, and Organizations (EAAMO), Pittsburgh, PA. November 2025.
             </Text>
           </div>

          <Heading level={3} className={cvStyles.cvSubsectionTitle}>Invited Talks & Panels</Heading>
          <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "Brown v. Board at 70: Fulfilling the True Promise of School Integration." Invited Presenter, Bridges Collaborative National Convening, The Century Foundation, Washington, DC. May 2024.
             </Text>
           </div>
            <div className={cvStyles.cvEntry}>
             <Text type="body" className={cvStyles.cvPresentation}>
               "From Art to Enforcement: Amplifying your Fair Housing Message." Invited Panelist, National Fair Housing Alliance National Conference, Washington, DC. July 2022.
             </Text>
           </div>
        </section>

            <section className={cvStyles.cvSection}>
        <Heading level={2} className={cvStyles.cvSectionTitle}>Honors & Fellowships</Heading>
        <div className={cvStyles.cvEntry}>
          <Text type="body"><b>Research Fellow, Inaugural School Finance Research Cohort</b> (2025)</Text>
          <Text type="metadata" className={cvStyles.cvEntryMeta}>EdFund</Text>
        </div>
        <div className={cvStyles.cvEntry}>
          <Text type="body"><b>Invited Participant, APPAM Innovation Day for Public Policy Research</b> (2025)</Text>
          <Text type="metadata" className={cvStyles.cvEntryMeta}>Association for Public Policy Analysis and Management (APPAM)</Text>
        </div>
      </section>

       <section className={cvStyles.cvSection}>
         <Heading level={2} className={cvStyles.cvSectionTitle}>Skills</Heading>
         <ul className={cvStyles.cvSkillsList}>
          <li><Text type="body"><b>Programming:</b> R, Python (Pandas, GeoPandas, Scikit-learn, NetworkX, Mesa), Stata, SQL, JavaScript (React, D3), TypeScript, LaTeX</Text></li>
          <li><Text type="body"><b>Spatial Analysis:</b> GIS (PostGIS, ArcGIS, QGIS), Spatial Statistics, Geovisualization (Mapbox GL JS, Leaflet)</Text></li>
          <li><Text type="body"><b>Data Science:</b> Machine Learning, Econometrics, Causal Inference, Agent-Based Modeling, Network Analysis, NLP</Text></li>
          <li><Text type="body"><b>Languages:</b> English (Native), Spanish (Fluent, C1), French (Intermediate, B1)</Text></li>
        </ul>
        </section>



      {/* Add other CV sections as needed (Awards, Teaching, Service, etc.) */}

    </main>
  );
}

export default CVPage;
