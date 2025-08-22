
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy extension files to dist directory after build
const sourceDir = 'public';
const targetDir = 'dist';

const filesToCopy = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'content.js',
  'content.css',
  'background.js',
  'domModifier.js',
  'nlpProcessor.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy extension files
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  // Ensure target directory exists
  const targetDirPath = path.dirname(targetPath);
  if (!fs.existsSync(targetDirPath)) {
    fs.mkdirSync(targetDirPath, { recursive: true });
  }
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`Source file not found: ${file}`);
  }
});

console.log('Chrome extension build complete!');
console.log('Load the extension by:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable Developer mode');
console.log('3. Click "Load unpacked" and select the "dist" folder');
