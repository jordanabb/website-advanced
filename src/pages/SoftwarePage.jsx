import React from 'react';
import { Heading, Text } from '../components/ui/Typography/Typography';
import Card from '../components/ui/Card/Card';
import Button from '../components/ui/Button/Button';
import Icon from '../components/ui/Icon/Icon';
import styles from './PageLayout.module.css';

function SoftwarePage() {
  const rPackages = [
    {
      id: 'censusgeos',
      name: 'censusgeos',
      description: 'A comprehensive R package for bulk downloading Census shapefiles at desired geographic resolutions. Streamlines the process of obtaining geographic boundary data from the U.S. Census Bureau for spatial analysis and mapping applications.',
      cranUrl: 'https://cran.r-project.org/package=censusgeos',
      githubUrl: 'https://github.com/username/censusgeos',
      icon: '📊'
    },
    {
      id: 'segregation',
      name: 'segregation',
      description: 'A collection of different segregation measures for analyzing spatial and social segregation patterns. Includes implementations of classic indices like dissimilarity, isolation, and exposure indices, as well as modern spatial segregation measures.',
      cranUrl: 'https://cran.r-project.org/package=segregation',
      githubUrl: 'https://github.com/username/segregation',
      icon: '🏘️'
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Heading level={1}>Software</Heading>
        <Text type="body">
          R packages I have developed for spatial analysis and demographic research.
        </Text>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.softwareGrid}>
          {rPackages.map((pkg) => (
            <Card key={pkg.id} className={styles.softwareCard}>
              <div className={styles.softwareHeader}>
                <span className={styles.softwareIcon}>{pkg.icon}</span>
                <Heading level={3} className={styles.softwareTitle}>
                  {pkg.name}
                </Heading>
              </div>

              <Text type="body" className={styles.softwareDescription}>
                {pkg.description}
              </Text>

              <div className={styles.softwareActions}>
                <Button
                  variant="primary"
                  size="small"
                  href={pkg.cranUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="Package" size={14} />
                  View on CRAN
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  href={pkg.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="Github" size={14} />
                  GitHub
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SoftwarePage;
