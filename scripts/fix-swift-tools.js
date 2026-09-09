const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Fix Swift tools version in Package.swift
  if (path.basename(filePath) === 'Package.swift') {
    content = content.replace(/swift-tools-version:\s*6\.[12]/g, 'swift-tools-version: 6.0');
  }

  // 2. Fix trailing comma in JavaScriptRuntime.swift
  if (filePath.endsWith('JavaScriptRuntime.swift')) {
    content = content.replace(
      /_ arguments: consuming JavaScriptValuesBuffer,\s*\)/g,
      '_ arguments: consuming JavaScriptValuesBuffer\n    )'
    );
  }

  // 3. Fix SWIFT_RETURNS_RETAINED in RuntimeScheduler.h
  if (filePath.endsWith('RuntimeScheduler.h')) {
    content = content.replace(
      /SWIFT_RETURNS_RETAINED\s+RuntimeScheduler\(/g,
      'RuntimeScheduler('
    );
  }

  // 4. Fix weak let / weak var in Sendable classes for Swift 6.0/6.1 compatibility
  if (filePath.endsWith('.swift')) {
    content = content.replace(
      /([^\w])weak\s+(?:let|var)\s+runtime\b/g,
      '$1nonisolated(unsafe) weak var runtime'
    );
    content = content.replace(
      /(?:nonisolated\(unsafe\)\s+)+nonisolated\(unsafe\)/g,
      'nonisolated(unsafe)'
    );
    content = content.replace(/\bweak\s+let\b/g, 'nonisolated(unsafe) weak var');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[fix-swift] Patched: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (
      entry.name.endsWith('.swift') ||
      entry.name === 'Package.swift' ||
      entry.name === 'RuntimeScheduler.h'
    ) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, '..', 'node_modules'));
walkDir(path.join(__dirname, '..', 'ios'));
