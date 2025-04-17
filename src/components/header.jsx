// src/components/Header.jsx
import React from 'react';
import styles from './Header.module.css'; 
function Header() {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.name}>Jordan Abbott</div> 
      <div className={styles.title}>PhD Candidate | Computational Social Science</div> 
    </header>
  );
}

export default Header;