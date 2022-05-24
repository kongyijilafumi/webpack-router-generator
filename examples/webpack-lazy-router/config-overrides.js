const {
  override,
  addWebpackPlugin,
  addWebpackResolve
} = require("customize-cra");
const path = require("path")
const WebpackRouterGenerator = require("../../src")
module.exports = override(
  // add  plugin
  addWebpackPlugin(new WebpackRouterGenerator({ outputFile: path.resolve(".", "./src/router/auto.js") })),
  // add resolve fix Requests that should resolve in the current directory need to start with './'.
  addWebpackResolve({ preferRelative: true })
);