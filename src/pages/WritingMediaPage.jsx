import React from 'react';
import { Heading, Text } from '../components/ui/Typography/Typography';
import { Card, CardHeader, CardBody } from '../components/ui/Card/Card';
import styles from './PageLayout.module.css';

// Import the data - we'll update this file to include writing and media data
import spatialData from '../../data/spatial-data.json';

function WritingMediaPage() {
  // Filter data for articles and media mentions
  const articles = spatialData.filter(item => item.type === 'article');
  const mediaMentions = spatialData.filter(item => item.type === 'media');

  const ArticleCard = ({ article }) => (
    <Card style={{ marginBottom: '20px' }}>
      <CardHeader>
        <Heading level={3} style={{ margin: '0 0 8px 0' }}>
          {article.url ? (
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--color-text-primary)', 
                textDecoration: 'none',
                borderBottom: '1px solid var(--color-accent)',
                paddingBottom: '2px'
              }}
            >
              {article.title}
            </a>
          ) : (
            article.title
          )}
        </Heading>
        <Text type="caption" style={{ color: 'var(--color-text-secondary)' }}>
          {article.publication} • {new Date(article.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </CardHeader>
      <CardBody>
        <Text type="body">{article.description}</Text>
        {article.topics && article.topics.length > 0 && (
          <div style={{ marginTop: '12px' }}>
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
      </CardBody>
    </Card>
  );

  const MediaCard = ({ mention }) => (
    <Card style={{ marginBottom: '20px' }}>
      <CardHeader>
        <Heading level={3} style={{ margin: '0 0 8px 0' }}>
          {mention.url ? (
            <a 
              href={mention.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--color-text-primary)', 
                textDecoration: 'none',
                borderBottom: '1px solid var(--color-accent)',
                paddingBottom: '2px'
              }}
            >
              {mention.title}
            </a>
          ) : (
            mention.title
          )}
        </Heading>
        <Text type="caption" style={{ color: 'var(--color-text-secondary)' }}>
          {mention.outlet} • {new Date(mention.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </CardHeader>
      <CardBody>
        <Text type="body">{mention.description}</Text>
        {mention.context && (
          <Text type="body" style={{ 
            marginTop: '8px', 
            fontStyle: 'italic',
            color: 'var(--color-text-secondary)'
          }}>
            {mention.context}
          </Text>
        )}
      </CardBody>
    </Card>
  );

  return (
    <main className={styles.mainContent}>
      <Heading level={1}>Writing & Media Coverage</Heading>
      
      <Text type="body" style={{ marginBottom: '40px' }}>
        A collection of my non-academic writing and media appearances discussing urban policy, 
        education equity, and spatial analysis research.
      </Text>

      {/* Non-Academic Articles Section */}
      <section style={{ marginBottom: '50px' }}>
        <Heading level={2} style={{ 
          marginBottom: '24px',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--color-accent)'
        }}>
          Articles & Commentary
        </Heading>
        
        {articles.length > 0 ? (
          <div>
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <Text type="body" style={{ color: 'var(--color-text-secondary)' }}>
            Articles and commentary pieces will be added here soon.
          </Text>
        )}
      </section>

      {/* Media Mentions Section */}
      <section>
        <Heading level={2} style={{ 
          marginBottom: '24px',
          paddingBottom: '8px',
          borderBottom: '2px solid var(--color-accent)'
        }}>
          Media Mentions
        </Heading>
        
        {mediaMentions.length > 0 ? (
          <div>
            {mediaMentions.map(mention => (
              <MediaCard key={mention.id} mention={mention} />
            ))}
          </div>
        ) : (
          <Text type="body" style={{ color: 'var(--color-text-secondary)' }}>
            Media coverage and mentions will be added here soon.
          </Text>
        )}
      </section>
    </main>
  );
}

export default WritingMediaPage;
