// src/components/Header.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Need Link and useLocation here
import styles from './Header.module.css'; // Use ONLY this CSS module
import ThemeToggle from './ui/ThemeToggle/ThemeToggle';

// --- Define Hamburger Button Component INSIDE Header ---
const HamburgerButton = ({ isOpen, toggleMenu }) => {
  return (
    <button
      className={`${styles.hamburgerButton} ${isOpen ? styles.open : ''}`}
      onClick={toggleMenu}
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-menu-panel"
    >
      <div className={styles.hamburgerLine}></div>
      <div className={styles.hamburgerLine}></div>
      <div className={styles.hamburgerLine}></div>
    </button>
  );
};

// --- Define Mobile Menu Component INSIDE Header ---
const MobileMenu = ({ isOpen, closeMenu }) => {
  const location = useLocation(); // Get current location

  // Close menu automatically when a link is clicked (route changes)
  useEffect(() => {
    if (isOpen) { // Only close if it was open
        closeMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]); // Rerun effect if location changes (closeMenu is stable via useCallback)

  return (
    <nav
      id="mobile-menu-panel"
      className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}
      aria-hidden={!isOpen}
    >
      <ul className={styles.menuList}>
        {/* Use Link component for navigation */}
        <li><Link to="/" className={styles.menuLink}>Map (Home)</Link></li>
        <li><Link to="/about" className={styles.menuLink}>About</Link></li>
        <li><Link to="/cv" className={styles.menuLink}>CV</Link></li>
        <li><Link to="/research" className={styles.menuLink}>Research</Link></li>
        <li><Link to="/software" className={styles.menuLink}>Software</Link></li>
        <li><Link to="/writing" className={styles.menuLink}>Writing</Link></li>
        <li><Link to="/contact" className={styles.menuLink}>Contact</Link></li>
      </ul>
    </nav>
  );
};


// --- Main Header Component ---
function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null); // Ref for the menu panel
  const buttonRef = useRef(null); // Ref for the button

  const toggleMenu = useCallback(() => { // useCallback prevents unnecessary re-renders of button/menu
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Effect to handle closing menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeMenu]);

  return (
    // Add 'menuOpen' class to header when menu is open
    <header className={`${styles.siteHeader} ${isOpen ? styles.menuOpen : ''}`}>
      {/* Left side content */}
      <div className={styles.leftContent}>
        <div className={styles.name}>Jordan Abbott</div>
        <div className={styles.title}>Senior Data Scientist | Education Funding Equity Initiative</div>
      </div>

      {/* Right side content - Theme Toggle and Hamburger Button */}
      {/* Assign ref to the direct parent div of the button */}
      <div className={styles.rightContent} ref={buttonRef}>
        <ThemeToggle />
        <HamburgerButton isOpen={isOpen} toggleMenu={toggleMenu} />
      </div>

      {/* Mobile Menu Panel - Use ref on its container */}
      <div ref={menuRef}>
        <MobileMenu isOpen={isOpen} closeMenu={closeMenu} />
      </div>

      {/* Optional: Overlay when menu is open */}
      {isOpen && <div className={styles.overlay} onClick={closeMenu} />}
    </header>
  );
}

export default Header;
