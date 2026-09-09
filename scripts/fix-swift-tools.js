const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name === 'Package.swift') {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('swift-tools-version: 6.2') || content.includes('swift-tools-version:6.2')) {
        content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[fix-swift] Patched: ${fullPath}`);
      }
    }
  }
}

walkDir(path.join(__dirname, '..', 'node_modules'));
