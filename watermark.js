/**
 * ============================================================================
 * WATERMARK UTILITY - Copyright Protection System
 * ============================================================================
 * This file implements a multi-layered watermarking system that embeds
 * copyright information into project files in ways that are difficult to remove.
 * 
 * Created by: Patrick Andrei Lefter
 * Protection Level: HARD
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Copyright notice
const OWNER = 'Patrick Andrei Lefter';
const WATERMARK_SIGNATURE = Buffer.from(`Created by ${OWNER}`, 'utf8').toString('base64');
const TIMESTAMP = new Date().toISOString();

/**
 * Encrypts a string using a simple algorithm
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in base64
 */
function encryptWatermark(text) {
  const cipher = crypto.createCipher('aes192', OWNER);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return Buffer.from(encrypted).toString('base64');
}

/**
 * Adds watermark to HTML files
 * @param {string} content - HTML file content
 * @returns {string} - HTML with watermark
 */
function watermarkHTML(content) {
  const watermarkHTML = `<!-- ============================================================
  SECURITY WATERMARK - Created by Patrick Andrei Lefter
  Document fingerprint: ${WATERMARK_SIGNATURE}
  Protected on: ${TIMESTAMP}
  Removing or modifying this watermark is a violation of copyright.
  ============================================================ -->
<!-- Generated asset with embedded copyright protection -->
`;
  
  const encryptedWatermark = `<!-- ${encryptWatermark(`Created by Patrick Andrei Lefter`)} -->`;
  
  // Insert watermark at the beginning and hide it in a data attribute
  let watermarked = watermarkHTML + content;
  
  // Add hidden watermark data to HTML tag if it exists
  watermarked = watermarked.replace(
    /<html[^>]*>/i,
    (match) => match.slice(0, -1) + ` data-watermark="${WATERMARK_SIGNATURE}" data-creator="Patrick Andrei Lefter">`
  );
  
  // Add encrypted watermark before closing body
  watermarked = watermarked.replace(
    /<\/body>/i,
    `${encryptedWatermark}\n</body>`
  );
  
  return watermarked;
}

/**
 * Adds watermark to JavaScript files
 * @param {string} content - JS file content
 * @returns {string} - JavaScript with watermark
 */
function watermarkJavaScript(content) {
  const watermarkJS = `
/**
 * ============================================================================
 * PROTECTED CONTENT - Copyright Patrick Andrei Lefter
 * ============================================================================
 * This file is protected with embedded watermarks and cryptographic signatures.
 * Unauthorized modification or removal is prohibited.
 * Signature: ${WATERMARK_SIGNATURE}
 * Created: ${TIMESTAMP}
 * ============================================================================
 */
(function() {
  const __WATERMARK__ = '${WATERMARK_SIGNATURE}';
  const __CREATOR__ = 'Patrick Andrei Lefter';
  const __TIMESTAMP__ = '${TIMESTAMP}';
  
  // This watermark is essential to the file's integrity
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, '__FILE_WATERMARK__', {
      value: __WATERMARK__,
      writable: false,
      configurable: false,
      enumerable: false
    });
  }
})();
`;

  return watermarkJS + '\n' + content;
}

/**
 * Adds watermark to CSS files
 * @param {string} content - CSS file content
 * @returns {string} - CSS with watermark
 */
function watermarkCSS(content) {
  const watermarkCSS = `/* ============================================================================
   * PROTECTED STYLESHEET - Created by Patrick Andrei Lefter
   * ============================================================================
   * Copyright Protection ID: ${WATERMARK_SIGNATURE}
   * Generated: ${TIMESTAMP}
   * Removing this notice violates copyright law.
   * ============================================================================ */

:root {
  --watermark-creator: "Patrick Andrei Lefter";
  --watermark-signature: "${WATERMARK_SIGNATURE}";
  --watermark-timestamp: "${TIMESTAMP}";
}

/* Embedded protection marker - DO NOT REMOVE */
html::before {
  content: "©Patrick Andrei Lefter";
  position: fixed;
  display: none;
  z-index: -2147483648;
}

`;

  return watermarkCSS + content;
}

/**
 * Adds watermark to Python files
 * @param {string} content - Python file content
 * @returns {string} - Python with watermark
 */
function watermarkPython(content) {
  const watermarkPython = `"""
================================================================================
PROTECTED PYTHON MODULE - Copyright Patrick Andrei Lefter
================================================================================
This module is protected with copyright watermarks.
Unauthorized modification or removal is prohibited.

Signature: ${WATERMARK_SIGNATURE}
Created: ${TIMESTAMP}
================================================================================
"""

__watermark__ = '${WATERMARK_SIGNATURE}'
__creator__ = 'Patrick Andrei Lefter'
__copyright__ = 'Copyright by Patrick Andrei Lefter'
__timestamp__ = '${TIMESTAMP}'

# Copyright protection constant - essential to module integrity
_PROTECTION_SIGNATURE = '${WATERMARK_SIGNATURE}'

`;

  return watermarkPython + '\n' + content;
}

/**
 * Main function to watermark all files in a directory
 * @param {string} directory - Directory to process
 * @param {boolean} recursive - Whether to process subdirectories
 */
function watermarkDirectory(directory = '.', recursive = true) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`WATERMARKING SYSTEM - Created by Patrick Andrei Lefter`);
  console.log(`${'='.repeat(80)}\n`);

  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && recursive) {
      // Skip node_modules and .git
      if (!['node_modules', '.git', '.github', 'dist', 'build'].includes(file)) {
        watermarkDirectory(filePath, recursive);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Skip already watermarked files
      if (content.includes(WATERMARK_SIGNATURE)) {
        console.log(`✓ Already watermarked: ${filePath}`);
        return;
      }
      
      let watermarked = content;
      
      try {
        switch (ext) {
          case '.html':
            watermarked = watermarkHTML(content);
            break;
          case '.js':
            watermarked = watermarkJavaScript(content);
            break;
          case '.css':
            watermarked = watermarkCSS(content);
            break;
          case '.py':
            watermarked = watermarkPython(content);
            break;
          default:
            return; // Skip other file types
        }
        
        fs.writeFileSync(filePath, watermarked, 'utf8');
        console.log(`✓ Watermarked: ${filePath}`);
      } catch (error) {
        console.error(`✗ Failed to watermark ${filePath}:`, error.message);
      }
    }
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Watermarking complete!`);
  console.log(`All files now contain copyright protection by Patrick Andrei Lefter`);
  console.log(`${'='.repeat(80)}\n`);
}

// Export for use in build scripts
module.exports = {
  watermarkHTML,
  watermarkJavaScript,
  watermarkCSS,
  watermarkPython,
  watermarkDirectory,
  OWNER,
  WATERMARK_SIGNATURE
};

// Run if executed directly
if (require.main === module) {
  const directory = process.argv[2] || '.';
  watermarkDirectory(directory);
}
