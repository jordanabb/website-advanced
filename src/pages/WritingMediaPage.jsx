import React from 'react';
import { Heading, Text } from '../components/ui/Typography/Typography';
import Card from '../components/ui/Card/Card';
import Button from '../components/ui/Button/Button';
import Icon from '../components/ui/Icon/Icon';
import styles from './PageLayout.module.css';

// Import the data - we'll update this file to include writing and media data
import spatialData from '../../data/spatial-data.json';

function WritingMediaPage() {
  // Filter data for articles and media mentions
  const articles = spatialData.filter(item => item.type === 'article');
  const mediaMentions = spatialData.filter(item => item.type === 'media');

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const ArticleCard = ({ article }) => (
    <Card className={styles.projectCard}>
      <div className={styles.projectHeader}>
        {article.url ? (
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.projectLink}
          >
            <Heading level={3} className={styles.projectTitle}>
              {article.title}
            </Heading>
          </a>
        ) : (
          <Heading level={3} className={styles.projectTitle}>
            {article.title}
          </Heading>
        )}
        
        <div className={styles.projectMeta}>
          <Text type="caption" className={styles.projectTiming}>
            {article.publication} • {formatDate(article.date)}
          </Text>
        </div>
      </div>

      <Text type="body" className={styles.projectDescription}>
        {article.description}
      </Text>

      {article.topics && article.topics.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {article.topics.map((topic, index) => (
            <span 
              key={index}
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text-secondary)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.85em',
                marginRight: '8px',
                marginBottom: '4px'
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {article.url && (
        <div className={styles.projectActions}>
          <Button
            variant="secondary"
            size="small"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read Article <Icon name="ExternalLink" size={14} />
          </Button>
        </div>
      )}
    </Card>
  );

  const MediaCard = ({ mention }) => (
    <Card className={styles.projectCard}>
      <div className={styles.projectHeader}>
        {mention.url ? (
          <a 
            href={mention.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.projectLink}
          >
            <Heading level={3} className={styles.projectTitle}>
              {mention.title}
            </Heading>
          </a>
        ) : (
          <Heading level={3} className={styles.projectTitle}>
            {mention.title}
          </Heading>
        )}
        
        <div className={styles.projectMeta}>
          <Text type="caption" className={styles.projectTiming}>
            {mention.outlet} • {formatDate(mention.date)}
          </Text>
        </div>
      </div>

      <Text type="body" className={styles.projectDescription}>
        {mention.description}
      </Text>

      {mention.context && (
        <Text type="body" className={styles.projectDescription} style={{ 
          fontStyle: 'italic',
          marginTop: '8px'
        }}>
          {mention.context}
        </Text>
      )}

      {mention.url && (
        <div className={styles.projectActions}>
          <Button
            variant="secondary"
            size="small"
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Coverage <Icon name="ExternalLink" size={14} />
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Heading level={1}>Writing & Media Coverage</Heading>
        <Text type="body">
          A collection of my non-academic writing and media appearances discussing school finance, 
          education equity, and spatial analysis.
        </Text>
      </div>

      <div className={styles.pageContent}>
        {/* Non-Academic Articles Section */}
        <div className={styles.workSection}>
          <div className={styles.workHeader}>
            <Heading level={2}>Articles & Commentary</Heading>
          </div>
          
          {articles.length > 0 ? (
            <div className={styles.projectsGrid}>
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Text type="body" className={styles.noProjects}>
              Articles and commentary pieces will be added here soon.
            </Text>
          )}
        </div>

        {/* Media Mentions Section */}
        <div className={styles.workSection}>
          <div className={styles.workHeader}>
            <Heading level={2}>Selected Media Mentions</Heading>
          </div>
          
          {mediaMentions.length > 0 ? (
            <div className={styles.projectsGrid}>
              {mediaMentions.map(mention => (
                <MediaCard key={mention.id} mention={mention} />
              ))}
            </div>
          ) : (
            <Text type="body" className={styles.noProjects}>
              Media coverage and mentions will be added here soon.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

export default WritingMediaPage;
