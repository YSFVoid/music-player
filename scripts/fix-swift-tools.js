const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Fix Swift tools version in Package.swift
  if (path.basename(filePath) === 'Package.swift') {
    content = content.replace(/swift-tools-version:\s*6\.[12]/g, 'swift-tools-version: 6.0');
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[fix-swift] Patched: ${filePath}`);
    }
    return;
  }

  // All other patches are strictly for expo-modules-jsi
  if (!filePath.includes('expo-modules-jsi')) return;

  // 2. Fix Task+immediate.swift for Swift 6.0/6.1 compatibility
  if (filePath.endsWith('Task+immediate.swift')) {
    content = content.replace(
      /if #available\([\s\S]*?\n\s*\}\s*else\s*\{[\s\S]*?\n\s*\}/m,
      'return Task(priority: .high, operation: operation)'
    );
  }

  // 3. Fix JavaScriptRuntime.swift
  if (filePath.endsWith('JavaScriptRuntime.swift')) {
    // Fix trailing comma in closure tuple
    content = content.replace(
      /_ arguments: consuming JavaScriptValuesBuffer,\s*\)/g,
      '_ arguments: consuming JavaScriptValuesBuffer\n    )'
    );
    // Fix immutable scheduler mutating member error
    content = content.replace(
      'internal let scheduler: expo.RuntimeScheduler',
      'internal var scheduler: expo.RuntimeScheduler'
    );
    // Fix vector.push_back using C++ helper
    content = content.replace(
      /for propertyName in propertyNames \{[\s\S]*?vector\.push_back\([^\)]*\)\s*\}/m,
      'for propertyName in propertyNames {\n        expo.pushPropNameId(&vector, iRuntime, std.string(propertyName))\n      }'
    );
  }

  // 4. Fix RuntimeScheduler.h for Swift 6.0/6.1 compatibility
  if (filePath.endsWith('RuntimeScheduler.h')) {
    content = content.replace(/SWIFT_RETURNS_RETAINED\s+/g, '');
    content = content.replace(/SWIFT_SHARED_REFERENCE\([^)]*\);/g, ';');
    content = content.replace(
      /RuntimeScheduler\(const RuntimeScheduler &\) = delete;/g,
      'RuntimeScheduler(const RuntimeScheduler &other) : nativeScheduler(other.nativeScheduler), scheduleFn(other.scheduleFn) {}'
    );
    content = content.replace(
      /void scheduleTask\(Priority priority, ScheduleTaskCallback callback\) noexcept/g,
      'void scheduleTask(Priority priority, ScheduleTaskCallback callback) const noexcept'
    );
  }

  // 5. Fix RetainedSwiftPointer.h
  if (filePath.endsWith('RetainedSwiftPointer.h')) {
    content = content.replace(/SWIFT_IMMORTAL_REFERENCE;/g, ';');
    content = content.replace(/using Deallocator = void\(Context\);/g, 'using Deallocator = void (*)(Context);');
    content = content.replace(/Deallocator \*_Nonnull _deallocator;/g, 'Deallocator _deallocator;');
    if (!content.includes('RetainedSwiftPointer(const RetainedSwiftPointer &')) {
      content = content.replace(
        /virtual ~RetainedSwiftPointer\(\) = default;/g,
        'virtual ~RetainedSwiftPointer() = default;\n  RetainedSwiftPointer(const RetainedSwiftPointer &other) : _context(other._context), _deallocator(other._deallocator) {}'
      );
    }
  }

  // 6. Fix HostFunctionClosure.h
  if (filePath.endsWith('HostFunctionClosure.h')) {
    content = content.replace(/SWIFT_IMMORTAL_REFERENCE;/g, ';');
    content = content.replace(
      /using Closure = (?:bool|void)\s*\(Context context, const facebook::jsi::Value \*_Nonnull thisValue, const facebook::jsi::Value \*_Nonnull args, size_t count, facebook::jsi::Value \*_Nonnull result\);/g,
      'using Closure = bool (*)(Context context, const facebook::jsi::Value *_Nonnull thisValue, const facebook::jsi::Value *_Nonnull args, size_t count, facebook::jsi::Value *_Nonnull result);'
    );
    content = content.replace(/Closure \*_Nonnull _closure;/g, 'Closure _closure;');
    if (!content.includes('HostFunctionClosure(const HostFunctionClosure &')) {
      content = content.replace(
        /virtual ~HostFunctionClosure\(\)/g,
        'HostFunctionClosure(const HostFunctionClosure &other) : RetainedSwiftPointer(other), _closure(other._closure) {}\n  virtual ~HostFunctionClosure()'
      );
    }
  }

  // 7. Fix JSIUtils.h (accept HostFunctionClosure by const ref)
  if (filePath.endsWith('JSIUtils.h')) {
    content = content.replace(
      /createHostFunction\(jsi::IRuntime &runtime, const jsi::PropNameID &propName, HostFunctionClosure \*closure\)/g,
      'createHostFunction(jsi::IRuntime &runtime, const jsi::PropNameID &propName, const HostFunctionClosure &closure)'
    );
    content = content.replace(
      /auto closurePtr = std::shared_ptr<HostFunctionClosure>\(closure\);/g,
      'auto closurePtr = std::make_shared<HostFunctionClosure>(closure);'
    );
    content = content.replace(
      /createHostFunction\(jsi::IRuntime &runtime, const char \*name, HostFunctionClosure \*closure\)/g,
      'createHostFunction(jsi::IRuntime &runtime, const char *name, const HostFunctionClosure &closure)'
    );
  }

  // 8. Fix HostObjectCallbacks.h (add pushPropNameId helper)
  if (filePath.endsWith('HostObjectCallbacks.h')) {
    if (!content.includes('pushPropNameId')) {
      content = content.replace(
        /(\} SWIFT_NONCOPYABLE;[^\n]*\n)/,
        '$1\ninline void pushPropNameId(HostObjectCallbacks::PropNameIds &vector, facebook::jsi::IRuntime &runtime, const std::string &name) {\n  vector.push_back(facebook::jsi::PropNameID::forUtf8(runtime, name));\n}\n'
      );
    }
  }

  // 9. Fix weak let / weak var in Sendable classes for Swift 6.0/6.1 compatibility
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
      entry.name === 'RuntimeScheduler.h' ||
      entry.name === 'RetainedSwiftPointer.h' ||
      entry.name === 'HostFunctionClosure.h' ||
      entry.name === 'JSIUtils.h' ||
      entry.name === 'HostObjectCallbacks.h'
    ) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, '..', 'node_modules'));
walkDir(path.join(__dirname, '..', 'ios'));
