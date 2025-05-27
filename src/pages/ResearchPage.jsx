import React from 'react';
import { Heading, Text } from '../components/ui/Typography/Typography';
import Card from '../components/ui/Card/Card';
import Button from '../components/ui/Button/Button';
import Icon from '../components/ui/Icon/Icon';
import resumeData from '../../data/spatial-data.json';
import styles from './PageLayout.module.css';

function ProjectsListPage() {
  // Get work experiences and sort them chronologically (most recent first)
  const workExperiences = resumeData
    .filter(item => item.type === 'work')
    .sort((a, b) => {
      const yearA = parseInt(a.startDate?.match(/^(\d{4})/)?.[1] || '0');
      const yearB = parseInt(b.startDate?.match(/^(\d{4})/)?.[1] || '0');
      return yearB - yearA; // Most recent first
    });

  // Function to format date range
  const formatDateRange = (startDate, endDate) => {
    const start = startDate || '';
    const end = endDate === 'Present' ? 'Present' : endDate || '';
    return end ? `${start} - ${end}` : start;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Heading level={1}>Reseach & Projects</Heading>
        <Text type="body">

        </Text>
      </div>

      <div className={styles.pageContent}>
        {workExperiences.map((work) => (
          <div key={work.id} className={styles.workSection}>
            {/* Work Experience Header */}
            <div className={styles.workHeader}>
              <Heading level={2}>{work.title}</Heading>
              <Text type="caption" className={styles.workMeta}>
                {work.institution} • {formatDateRange(work.startDate, work.endDate)}
              </Text>
              <Text type="body" className={styles.workDescription}>
                {work.description}
              </Text>
            </div>

            {/* Associated Projects */}
            {work.projects && work.projects.length > 0 ? (
              <div className={styles.projectsGrid}>
                {work.projects
                  .sort((a, b) => {
                    // Sort projects within work experience chronologically
                    const yearA = parseInt(a.startDate?.match(/^(\d{4})/)?.[1] || '0');
                    const yearB = parseInt(b.startDate?.match(/^(\d{4})/)?.[1] || '0');
                    return yearB - yearA; // Most recent first
                  })
                  .map((project) => (
                    <Card key={project.id} className={styles.projectCard}>
                      <div className={styles.projectHeader}>
                        {project.url ? (
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.projectLink}
                          >
                            <Heading level={3} className={styles.projectTitle}>
                              {project.title}
                            </Heading>
                          </a>
                        ) : (
                          <Heading level={3} className={styles.projectTitle}>
                            {project.title}
                          </Heading>
                        )}
                        
                        <div className={styles.projectMeta}>
                          <Text type="caption" className={styles.projectTiming}>
                            {formatDateRange(project.startDate, project.endDate)}
                          </Text>
                          <Text type="caption" className={styles.projectStatus}>
                            {project.status}
                          </Text>
                        </div>
                      </div>

                      <Text type="body" className={styles.projectDescription}>
                        {project.description}
                      </Text>

                      {project.url && (
                        <div className={styles.projectActions}>
                          <Button
                            variant="secondary"
                            size="small"
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Project <Icon name="ExternalLink" size={14} />
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
              </div>
            ) : (
              <Text type="body" className={styles.noProjects}>
                No projects associated with this position.
              </Text>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectsListPage;
