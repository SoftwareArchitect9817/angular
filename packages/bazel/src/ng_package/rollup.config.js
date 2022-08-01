/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Rollup configuration
// GENERATED BY Bazel

const {nodeResolve} = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const sourcemaps = require('rollup-plugin-sourcemaps');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

function log_verbose(...m) {
  // This is a template file so we use __filename to output the actual filename
  if (!!process.env['VERBOSE_LOGS']) console.error(`[${path.basename(__filename)}]`, ...m);
}

const workspaceName = 'TMPL_workspace_name';
const rootDir = 'TMPL_root_dir';
const bannerFile = TMPL_banner_file;
const stampData = TMPL_stamp_data;
const moduleMappings = TMPL_module_mappings;
const downlevelToES2015 = TMPL_downlevel_to_es2015;
const nodeModulesRoot = 'TMPL_node_modules_root';

log_verbose(`running with
  cwd: ${process.cwd()}
  workspaceName: ${workspaceName}
  rootDir: ${rootDir}
  bannerFile: ${bannerFile}
  stampData: ${stampData}
  moduleMappings: ${JSON.stringify(moduleMappings)}
  nodeModulesRoot: ${nodeModulesRoot}
`);

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

// This resolver mimics the TypeScript Path Mapping feature, which lets us resolve
// modules based on a mapping of short names to paths.
function resolveBazel(importee, importer) {
  log_verbose(`resolving '${importee}' from ${importer}`);

  const baseDir = process.cwd();

  function resolveInRootDir(importee) {
    var candidate = path.join(baseDir, rootDir, importee);
    log_verbose(`try to resolve '${importee}' at '${candidate}'`);
    try {
      var result = require.resolve(candidate);
      return result;
    } catch (e) {
      return undefined;
    }
  }

  // Since mappings are always in POSIX paths, when comparing the importee to mappings
  // we should normalize the importee.
  // Having it normalized is also useful to determine relative paths.
  const normalizedImportee = importee.replace(/\\/g, '/');

  // If import is fully qualified then resolve it directly
  if (fileExists(importee)) {
    log_verbose(`resolved fully qualified '${importee}'`);
    return importee;
  }

  var resolved;
  if (normalizedImportee.startsWith('./') || normalizedImportee.startsWith('../')) {
    // relative import
    if (importer) {
      let importerRootRelative = path.dirname(importer);
      const relative = path.relative(path.join(baseDir, rootDir), importerRootRelative);
      if (!relative.startsWith('.')) {
        importerRootRelative = relative;
      }
      resolved = path.join(importerRootRelative, importee);
    } else {
      throw new Error('cannot resolve relative paths without an importer');
    }
    if (resolved) resolved = resolveInRootDir(resolved);
  }

  if (!resolved) {
    // possible workspace import or external import if importee matches a module
    // mapping
    for (const k in moduleMappings) {
      if (normalizedImportee == k || normalizedImportee.startsWith(k + '/')) {
        // replace the root module name on a mappings match
        // note that the module_root attribute is intended to be used for type-checking
        // so it uses eg. "index.d.ts". At runtime, we have only index.js, so we strip the
        // .d.ts suffix and let node require.resolve do its thing.
        var v = moduleMappings[k].replace(/\.d\.ts$/, '');
        const mappedImportee = path.join(v, normalizedImportee.slice(k.length + 1));
        log_verbose(`module mapped '${importee}' to '${mappedImportee}'`);
        resolved = resolveInRootDir(mappedImportee);
        if (resolved) break;
      }
    }
  }

  if (!resolved) {
    // workspace import
    const userWorkspacePath = path.relative(workspaceName, importee);
    resolved = resolveInRootDir(userWorkspacePath.startsWith('..') ? importee : userWorkspacePath);
  }

  if (resolved) {
    if (path.extname(resolved) == '.js') {
      // check for .mjs file and prioritize that
      const resolved_mjs = resolved.slice(0, -3) + '.mjs';
      if (fileExists(resolved_mjs)) {
        resolved = resolved_mjs;
      }
    }
    log_verbose(`resolved to ${resolved}`);
  } else {
    log_verbose(`allowing rollup to resolve '${importee}' with node module resolution`);
  }

  return resolved;
}

let banner = '';
if (bannerFile) {
  banner = fs.readFileSync(bannerFile, {encoding: 'utf-8'});
  if (stampData) {
    const versionTag = fs.readFileSync(stampData, {encoding: 'utf-8'})
                           .split('\n')
                           .find(s => s.startsWith('BUILD_SCM_VERSION'));
    // Don't assume BUILD_SCM_VERSION exists
    if (versionTag) {
      const version = versionTag.split(' ')[1].trim();
      banner = banner.replace(/0.0.0-PLACEHOLDER/, version);
    }
  }
}

// Transform that is enabled for ES2015 FESM generation. It transforms existing ES2020
// prodmode output to ES2015 so that we can generate the ES2015 flat ESM bundle.
const downlevelToES2015Plugin = {
  name: 'downlevel-to-es2015',
  transform: (code, filePath) => {
    const compilerOptions = {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.ES2015,
      allowJs: true,
      sourceMap: true,
      downlevelIteration: true,
      importHelpers: true,
      mapRoot: path.dirname(filePath),
    };
    const {outputText, sourceMapText} = ts.transpileModule(code, {compilerOptions});
    return {
      code: outputText,
      map: JSON.parse(sourceMapText),
    };
  },
};

const plugins = [
  {
    name: 'resolveBazel',
    resolveId: resolveBazel,
  },
  nodeResolve({
    mainFields: ['es2020', 'es2015', 'module', 'browser'],
    jail: process.cwd(),
    customResolveOptions: {moduleDirectory: nodeModulesRoot}
  }),
  commonjs({ignoreGlobal: true}),
  sourcemaps(),
];

// If downleveling to ES2015 is enabled, set up the downlevel rollup plugin.
if (downlevelToES2015) {
  plugins.push(downlevelToES2015Plugin);
}

const config = {
  plugins,
  external: [TMPL_external],
  output: {
    banner,
  }
};

module.exports = config;