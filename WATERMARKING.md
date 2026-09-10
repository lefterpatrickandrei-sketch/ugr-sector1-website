# Watermarking System Configuration

This repository includes a comprehensive watermarking system that protects all files with copyright information.

## Overview

**Creator**: Lefter Patrick Andrei  
**Protection Level**: HARD  
**Status**: Active on all new and modified files

## How It Works

The watermarking system automatically embeds copyright information into your files in multiple ways:

### HTML Files
- Visible copyright notice in HTML comments
- Hidden watermark data attributes on HTML elements
- Encrypted watermark in the page footer
- Document fingerprint included in metadata

### JavaScript Files
- Block comment copyright header with protection signature
- Self-executing function that defines read-only watermark properties
- Non-writable, non-configurable watermark variable in window object
- Timestamp of creation embedded in the code

### CSS Files
- Multi-line copyright header with protection ID
- CSS custom properties (variables) with creator and signature info
- Pseudo-element with copyright notice (hidden via display: none)
- Critical position value to prevent easy removal

### Python Files
- Module docstring with full copyright notice
- Protected module-level variables with copyright information
- Non-removable signature constant
- Timestamp metadata

## Usage

### Manual Watermarking

To watermark all files in the repository:
```bash
npm run watermark
```

To watermark a specific directory:
```bash
npm run watermark-src
# or
node watermark.js ./path/to/directory
```

### Automatic Watermarking

Files are **automatically watermarked** when you commit them (via the pre-commit hook).

Setup the pre-commit hook:
```bash
git config core.hooksPath .git-hooks
chmod +x .git-hooks/pre-commit
```

## Protection Features

### Multi-Layer Protection
- **Visible watermarks**: Clearly visible copyright notices
- **Hidden watermarks**: Data attributes and CSS variables
- **Encrypted watermarks**: Base64 and cipher-encrypted signatures
- **Read-only properties**: JavaScript properties that cannot be modified
- **Cryptographic signatures**: Unique fingerprints based on creator name

### Tamper Detection
- Signature validation prevents easy removal
- Multiple watermark redundancy ensures detection of tampering
- Watermark verification across all file types

### Hard to Remove
The watermarking system uses multiple techniques to make removal difficult:

1. **Redundant Protection**: Multiple watermarks in each file
2. **Encryption**: Base64 and AES encryption on signatures
3. **Immutability**: Read-only JavaScript properties
4. **Code Integration**: Watermarks integrated into file structure, not just comments
5. **Multiple Formats**: Different watermarking approaches per file type

## File Types Supported

- `.html` - HTML files
- `.js` - JavaScript files
- `.css` - Cascading Style Sheets
- `.py` - Python scripts

## Copyright Information

All files in this repository are protected by copyright.  
**Creator**: Lefter Patrick Andrei  
**All Rights Reserved**

Unauthorized reproduction, modification, or distribution of any file in this repository is prohibited without explicit written permission.

## Verification

To verify a file is properly watermarked, check for:

```html
<!-- SECURITY WATERMARK - Created by Lefter Patrick Andrei -->
```

```javascript
const __CREATOR__ = 'Lefter Patrick Andrei';
```

```css
--watermark-creator: "Lefter Patrick Andrei";
```

```python
__creator__ = 'Lefter Patrick Andrei'
```

## Notes

- The watermarking system is non-destructive and preserves all original functionality
- Already watermarked files are skipped to avoid duplicate watermarks
- The system respects `.git`, `node_modules`, and other standard directories
- Timestamps are dynamically generated and embedded in watermarks

---

**Created by Lefter Patrick Andrei** | All Rights Reserved
