import React from 'react';
import styles from './Typography.module.css'; // Use relative path

// Basic example for headings
const Heading = ({ level = 1, children, className = '', ...props }) => {
  const Tag = `h${level}`; // h1, h2, etc.
  // Combine component-specific class with any passed className
  const combinedClassName = `${styles[`h${level}`]} ${className}`;
  return <Tag className={combinedClassName} {...props}>{children}</Tag>;
};

// Basic example for paragraph text
const Text = ({ children, className = '', type = 'body', ...props }) => {
  // Combine component-specific class with any passed className
  const combinedClassName = `${styles[type]} ${className}`;
  // Use 'p' for body, 'span' for others unless specified
  const Tag = type === 'body' ? 'p' : 'span';
  return <Tag className={combinedClassName} {...props}>{children}</Tag>;
};

export { Heading, Text }; // Export separately or as properties of an object
