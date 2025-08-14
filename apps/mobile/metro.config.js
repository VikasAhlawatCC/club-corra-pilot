const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1) Watch the workspace so edits to packages get picked up
config.watchFolders = [workspaceRoot];

// 2) Resolve modules from the app and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3) Always prefer single resolution from workspace root (helps monorepos)
config.resolver.disableHierarchicalLookup = true;

// 4) Make sure TypeScript from shared packages compiles
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
