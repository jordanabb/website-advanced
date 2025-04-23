import React from 'react';
import styles from './Card.module.css'; // Import the CSS module

const Card = ({ children, className = '', ...props }) => {
  // Combine the base card style with any additional classes passed in
  const combinedClassName = `${styles.card} ${className}`.trim();

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

// Optional: Define sub-components for structure if needed
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`${styles.cardHeader} ${className}`.trim()} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`${styles.cardBody} ${className}`.trim()} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`${styles.cardFooter} ${className}`.trim()} {...props}>
    {children}
  </div>
);

// Export the main Card component and any sub-components
export { Card, CardHeader, CardBody, CardFooter };

// Default export can be the main Card component
export default Card;
