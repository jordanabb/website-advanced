import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for internal navigation
import styles from './Button.module.css'; // Import the CSS module

const Button = ({
  children,
  href, // URL for external links or internal paths
  to, // Use 'to' specifically for react-router Link
  onClick,
  type = 'button', // Default HTML button type
  variant = 'primary', // e.g., 'primary', 'secondary', 'ghost'
  size = 'medium', // e.g., 'small', 'medium', 'large'
  disabled = false,
  className = '', // Allow passing additional classes
  download, // For download links
  target, // For link target (_blank, etc.)
  rel, // For link rel attribute
  ...props // Pass any other props like aria-label, etc.
}) => {
  // Determine the base class based on variant and size
  const baseClassName = `
    ${styles.button}
    ${styles[variant] || styles.primary}
    ${styles[size] || styles.medium}
    ${disabled ? styles.disabled : ''}
    ${className}
  `.trim().replace(/\s+/g, ' '); // Clean up extra spaces

  // If 'to' prop is provided, render a react-router Link
  if (to) {
    return (
      <Link
        to={to}
        className={baseClassName}
        onClick={onClick} // Allow onClick even on Links
        aria-disabled={disabled} // Use aria-disabled for links
        {...(disabled && { style: { pointerEvents: 'none' } })} // Prevent clicks if disabled
        {...props}
      >
        {children}
      </Link>
    );
  }

  // If 'href' prop is provided, render a standard anchor tag
  if (href) {
    return (
      <a
        href={disabled ? undefined : href} // Prevent navigation if disabled
        className={baseClassName}
        onClick={onClick}
        target={target}
        rel={rel}
        download={download}
        aria-disabled={disabled}
        {...(disabled && { style: { pointerEvents: 'none' } })} // Prevent clicks if disabled
        {...props}
      >
        {children}
      </a>
    );
  }

  // Otherwise, render a standard button element
  return (
    <button
      type={type}
      className={baseClassName}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
