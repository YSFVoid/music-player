const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

function patchSwiftInterfaceContent(content) {
  content = content.replace(/Apple Swift version 6\.[23][^\n]*/g, 'Apple Swift version 6.1.2 (swiftlang-6.1.2.1.2 clang-1700.0.13.5)');
  content = content.replace(/-interface-compiler-version 6\.[23][^\s]*/g, '-interface-compiler-version 6.1.2');
  content = content.replace(/extension UIKit\.UIView\s*:\s*@_Concurrency\.MainActor\s+ExpoModulesCore\.AnyArgument/g, 'extension UIKit.UIView : ExpoModulesCore.AnyArgument');
  content = content.replace(/@_Concurrency\.MainActor/g, '@MainActor');
  return content;
}

function patchTarball(tarPath) {
  if (!fs.existsSync(tarPath)) return;
  const tmpDir = path.join(path.dirname(tarPath), 'tmp_unpacked_' + path.basename(tarPath, '.tar.gz'));
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    child_process.execFileSync('tar', ['-xzf', tarPath, '-C', tmpDir]);
    let patched = false;
    function walk(dir) {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name);
        if (f.isDirectory()) walk(p);
        else if (f.name.endsWith('.swiftinterface')) {
          let c = fs.readFileSync(p, 'utf8');
          const patchedC = patchSwiftInterfaceContent(c);
          if (patchedC !== c) {
            fs.writeFileSync(p, patchedC, 'utf8');
            patched = true;
          }
        }
      }
    }
    walk(tmpDir);
    if (patched) {
      const rootEntries = fs.readdirSync(tmpDir);
      child_process.execFileSync('tar', ['-czf', tarPath, '-C', tmpDir, ...rootEntries]);
      console.log(`[fix-swift] Patched tarball: ${tarPath}`);
    }
  } catch (e) {
    console.warn(`[fix-swift] Failed to patch tarball ${tarPath}:`, e.message);
  } finally {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Fix Swift tools version in Package.swift
  if (path.basename(filePath) === 'Package.swift') {
    content = content.replace(/swift-tools-version:\s*6\.[123]/g, 'swift-tools-version: 6.0');
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[fix-swift] Patched: ${filePath}`);
    }
    return;
  }

  // 2. Fix any .swiftinterface files directly
  if (filePath.endsWith('.swiftinterface')) {
    content = patchSwiftInterfaceContent(content);
  }

  // 2b. Fix MediaHandler.swift in expo-image-picker (removes iOS 26 compile-time error)
  if (filePath.endsWith('MediaHandler.swift')) {
    content = content.replace(
      /let utType:\s*UTType\?\s*=\s*if #available\(iOS 26\.0, \*\)\s*\{[\s\S]*?\}\s*else\s*\{\s*([\s\S]*?)\s*\}/g,
      'let utType: UTType? = $1'
    );
  }

  // All other patches are strictly for expo-modules-jsi
  if (filePath.includes('expo-modules-jsi')) {

  // 5. Fix Task+immediate.swift for Swift 6.0/6.1 compatibility
  if (filePath.endsWith('Task+immediate.swift')) {
    content = content.replace(
      /if #available\([\s\S]*?\n\s*\}\s*else\s*\{[\s\S]*?\n\s*\}/m,
      'return Task(priority: .high, operation: operation)'
    );
  }

  // 3. Fix JavaScriptRuntime.swift
  if (filePath.endsWith('JavaScriptRuntime.swift')) {
    const hasCRLF = content.includes('\r\n');
    content = content.replace(/\r\n/g, '\n');

    // Add SendablePointer at top if not present
    if (!content.includes('struct SendablePointer')) {
      content = 'private struct SendablePointer<T>: @unchecked Sendable {\n  let pointer: T\n}\n\n' + content;
    }

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
    // Fix getter resultPtr race error
    const getterTarget = "      let propertyName = String(cString: propertyName)\n      nonisolated(unsafe) let resultPtr = resultPtr\n\n      return withGuaranteedContext(context) { (context: HostObjectContext, runtime) in\n        return JavaScriptActor.assumeIsolated {\n          return forwardingSwiftErrorsToJS(runtime: runtime) {\n            try context.get(propertyName).writeJSIValue(to: resultPtr)";
    const getterReplacement = "      let propertyName = String(cString: propertyName)\n      let s_resultPtr = SendablePointer(pointer: resultPtr)\n\n      return withGuaranteedContext(context) { (context: HostObjectContext, runtime) in\n        return JavaScriptActor.assumeIsolated {\n          return forwardingSwiftErrorsToJS(runtime: runtime) {\n            try context.get(propertyName).writeJSIValue(to: s_resultPtr.pointer)";
    content = content.replace(getterTarget, getterReplacement);

    // Fix Call 1 and Call 2 declarations
    const declRegex = /nonisolated\(unsafe\)\s+let\s+thisPtr\s*=\s*thisPtr\s*\n\s*nonisolated\(unsafe\)\s+let\s+argumentsPtr\s*=\s*argumentsPtr\s*\n\s*nonisolated\(unsafe\)\s+let\s+resultPtr\s*=\s*resultPtr/g;
    content = content.replace(declRegex, 'let s_thisPtr = SendablePointer(pointer: thisPtr)\n    let s_argumentsPtr = SendablePointer(pointer: argumentsPtr)\n    let s_resultPtr = SendablePointer(pointer: resultPtr)');

    // Fix Call 1 and Call 2 usages
    content = content.replace('UnsafeMutablePointer(mutating: thisPtr).move()', 'UnsafeMutablePointer(mutating: s_thisPtr.pointer).move()');
    content = content.replace('JavaScriptUnownedValue(runtime.pointee, thisPtr)', 'JavaScriptUnownedValue(runtime.pointee, s_thisPtr.pointer)');
    content = content.replace(/start:\s*argumentsPtr/g, 'start: s_argumentsPtr.pointer');
    content = content.replace(/try context\.call\(thisValue, consume arguments\)\.writeJSIValue\(to:\s*resultPtr\)/g, 'try context.call(thisValue, consume arguments).writeJSIValue(to: s_resultPtr.pointer)');

    if (hasCRLF) {
      content = content.replace(/\n/g, '\r\n');
    }
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
    content = `#pragma once

#include <memory>
#include <swift/bridging>

namespace expo {

/**
 Holds a type-erased pointer to a Swift instance that is now owned by this C++ instance.
 Uses std::shared_ptr to safely maintain ownership across copies without premature deallocation.
 */
class RetainedSwiftPointer {
public:
  using Context = void *_Nonnull;
  using Deallocator = void (*)(Context);

  explicit RetainedSwiftPointer(Context context, Deallocator deallocator)
    : _context(context),
      _holder(context, [deallocator](void *ctx) {
        if (ctx && deallocator) {
          deallocator(ctx);
        }
      }) {}

  virtual ~RetainedSwiftPointer() = default;
  RetainedSwiftPointer(const RetainedSwiftPointer &other) = default;

protected:
  Context _context;
  std::shared_ptr<void> _holder;
};

} // namespace expo
`;
  }

  // 6. Fix HostFunctionClosure.h
  if (filePath.endsWith('HostFunctionClosure.h')) {
    content = `#pragma once

#include <swift/bridging>
#include <jsi/jsi.h>
#include <memory>

#include "RetainedSwiftPointer.h"

namespace expo {

/**
 Holds a pointer to a closure in Swift that provides host function's implementation.
 Inherits RetainedSwiftPointer to keep the Swift closure context alive as long as this closure exists.
 */
class HostFunctionClosure final : public RetainedSwiftPointer {
public:
  using Closure = bool (*)(Context context, const facebook::jsi::Value *_Nonnull thisValue, const facebook::jsi::Value *_Nonnull args, size_t count, facebook::jsi::Value *_Nonnull result);

  explicit HostFunctionClosure(Context context, Closure closure, Deallocator deallocator)
    : RetainedSwiftPointer(context, deallocator), _closure(closure) {}

  HostFunctionClosure(const HostFunctionClosure &other) = default;
  virtual ~HostFunctionClosure() = default;

  /**
   Calls the Swift closure with given this value and arguments.
   */
  inline bool call(const facebook::jsi::Value &thisValue, const facebook::jsi::Value *_Nonnull args, size_t count, facebook::jsi::Value &result) const {
    return _closure(_context, &thisValue, args, count, &result);
  }

private:
  Closure _closure;
};

} // namespace expo
`;
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
  }

  // 12. Fix weak let / weak var in Sendable classes for Swift 6.0/6.1 compatibility
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
    } else if (entry.name.endsWith('.tar.gz') && fullPath.includes('prebuilds')) {
      patchTarball(fullPath);
    } else if (
      entry.name.endsWith('.swift') ||
      entry.name.endsWith('.swiftinterface') ||
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
walkDir(path.join(__dirname, '..', 'build'));
