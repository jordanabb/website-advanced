import React from 'react';
import { Heading, Text } from '../components/ui/Typography/Typography';
import { Card, CardHeader, CardBody } from '../components/ui/Card/Card';
import styles from './PageLayout.module.css'; 

function ContactPage() {
  return (
    <main className={styles.mainContent}>
      <div className={styles.pageHeader}>
        <Heading level={1} className={styles.pageTitle}>Contact</Heading>
      </div>
      
      <Text type="body" style={{ marginBottom: '40px' }}>
        I'm always interested in connecting with fellow researchers, policymakers, and practitioners 
        working on issues related to urban policy, education equity, and spatial analysis.
      </Text>

      {/* Contact Information Card */}
      <Card style={{ marginBottom: '30px' }}>
        <CardHeader>
          <Heading level={2} style={{ margin: '0 0 16px 0' }}>Get In Touch</Heading>
        </CardHeader>
        <CardBody>
          <Text type="body" style={{ marginBottom: '16px' }}>
            <strong>Email:</strong> jordan.abbott@gmail.com
          </Text>
          <Text type="body" style={{ marginBottom: '16px' }}>
            <strong>LinkedIn:</strong>{' '}
            <a 
              href="https://www.linkedin.com/in/jordan-abbott" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--color-accent)', 
                textDecoration: 'none',
                borderBottom: '1px solid var(--color-accent)'
              }}
            >
              linkedin.com/in/jordan-abbott
            </a>
          </Text>
          <Text type="body">
            <strong>Location:</strong> Stanford, CA / Washington, DC
          </Text>
        </CardBody>
      </Card>

      {/* Collaboration Interests Card */}
      <Card style={{ marginBottom: '30px' }}>
        <CardHeader>
          <Heading level={2} style={{ margin: '0 0 16px 0' }}>Collaboration Interests</Heading>
        </CardHeader>
        <CardBody>
          <Text type="body" style={{ marginBottom: '12px' }}>
            I'm particularly interested in collaborating on projects involving:
          </Text>
          <ul style={{ 
            marginLeft: '20px', 
            marginBottom: '16px',
            color: 'var(--color-text-primary)'
          }}>
            <li style={{ marginBottom: '8px' }}>Urban policy analysis and spatial modeling</li>
            <li style={{ marginBottom: '8px' }}>Education funding equity research</li>
            <li style={{ marginBottom: '8px' }}>Housing policy and demographic analysis</li>
            <li style={{ marginBottom: '8px' }}>Computational social science methodologies</li>
            <li style={{ marginBottom: '8px' }}>Data visualization and interactive mapping</li>
          </ul>
          <Text type="body">
            Whether you're working on academic research, policy analysis, or applied projects 
            that could benefit from spatial data science approaches, I'd love to hear from you.
          </Text>
        </CardBody>
      </Card>

      {/* Freelance Work Card */}
      <Card>
        <CardHeader>
          <Heading level={2} style={{ margin: '0 0 16px 0' }}>Freelance & Consulting</Heading>
        </CardHeader>
        <CardBody>
          <Text type="body" style={{ marginBottom: '16px' }}>
            I occasionally take on freelance projects depending on my availability and alignment 
            with my research interests. Services include:
          </Text>
          <ul style={{ 
            marginLeft: '20px', 
            marginBottom: '16px',
            color: 'var(--color-text-primary)'
          }}>
            <li style={{ marginBottom: '8px' }}>Data analysis and statistical modeling</li>
            <li style={{ marginBottom: '8px' }}>Spatial analysis and GIS consulting</li>
            <li style={{ marginBottom: '8px' }}>Web development and data visualization</li>
            <li style={{ marginBottom: '8px' }}>Policy research and report writing</li>
          </ul>
          <Text type="body">
            Please reach out via email to discuss potential projects and availability.
          </Text>
        </CardBody>
      </Card>

      {/* Website Information */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: 'var(--color-surface-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)'
      }}>
        <Text type="caption" style={{ 
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic'
        }}>
          This website was custom-built using React and Node.js, featuring interactive spatial 
          visualizations and responsive design. The source code demonstrates my full-stack 
          development capabilities alongside my research work.
        </Text>
      </div>
    </main>
  );
}

export default ContactPage;
