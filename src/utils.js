const fs = require("fs")
const path = require("path")
function readDir(path) {
  try {
    return fs.readdirSync(path);
  } catch (error) {
    log("error", "读取文件夹失败" + error);
    return []
  }
}
function isExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    log("error", "读取文件夹失败" + error);
    return false
  }
}
function getNormaPath(filePath = "", isAbsolute = true) {
  if (isAbsolute) {
    return filePath
  }
  if (/^(\.(\/|\\)|\.\.(\/|\\))/.test(filePath)) {
    return filePath
  }
  const concatPath = "." + path.sep + filePath
  return concatPath
}
function isFile(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (error) {
    log("error", "获取文件信息失败" + error);
    return false
  }
}
function isDir(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    log("error", "获取文件夹失败" + error);
    return false
  }
}
function getExtName(filePath) {
  return path.extname(filePath)
}
function getRelativePath(form, to) {
  return path.relative(path.dirname(form), to)
}
function getTagName(relativePath = '') {
  let path = relativePath.replace(/\.|\\|\//g, "")
  return path.slice(0, 1).toLocaleUpperCase() + path.slice(1)
}
function log(type, msg) {
  console[type](`WebpackRouterGenerator[${type}]:${msg}`)
}

module.exports = {
  log,
  getExtName,
  getNormaPath,
  getRelativePath,
  getTagName,
  isFile,
  isDir,
  isExists,
  readDir
}