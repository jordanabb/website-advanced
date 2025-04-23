// src/components/ui/Icon/Icon.jsx
import React from 'react';
import { icons } from 'lucide-react'; // Import all icons from lucide-react
import styles from './Icon.module.css'; // Import the CSS module

const Icon = ({
  name,              // Name of the icon (e.g., "Download", "GitHub")
  color,             // Optional: Specific color override
  size = 16,         // Default size
  strokeWidth = 1.5, // Default stroke width
  className = '',    // Allow passing external classes
  ...props           // Pass any other SVG props
}) => {
  const LucideIcon = icons[name]; // Dynamically get the icon component by name

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null; // Or return a default fallback icon component
  }

  // Combine the base module class with any passed className
  const combinedClassName = `${styles.icon} ${className}`;

  return (
    <LucideIcon
      color={color || 'currentColor'} // Default to inheriting text color
      size={size}
      strokeWidth={strokeWidth}
      className={combinedClassName} // Apply the combined class names
      aria-hidden="true" // Usually decorative, hide from screen readers
      focusable="false" // Prevent icon from receiving focus
      {...props} // Spread remaining props (like style, etc.)
    />
  );
};

export default Icon;