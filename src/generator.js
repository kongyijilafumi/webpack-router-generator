const generator = require("@babel/generator").default
const babelt = require("@babel/types")

function getIdentifierExpression(name) {
  return babelt.identifier(name)
}
function getArrowFunctionExpression(parmas, body) {
  return babelt.arrowFunctionExpression(parmas, body)
}
function getCallExpression(name, args) {
  return babelt.callExpression(name, args)
}
function getStringExpression(val) {
  return babelt.stringLiteral(val)
}
function getObjectPropty(name, value) {
  return babelt.objectProperty(
    babelt.identifier(name),
    value
  );
}
function getJsxTag(tagName, jsxAttr = [], selfClose = true) {
  return babelt.jsxElement(
    babelt.jsxOpeningElement(
      babelt.jsxIdentifier(tagName), jsxAttr, selfClose
    ),
    null,
    []
  )
}

function getImportDeclaration(defaultName, sourceName) {
  return babelt.importDeclaration(
    [
      babelt.importDefaultSpecifier(
        babelt.identifier(defaultName)
      )
    ],
    babelt.stringLiteral(sourceName)
  )
}

function getAstCodeStr(body) {
  const { code } = generator({ type: "Program", body })
  return code
}

module.exports = {
  getAstCodeStr,
  getImportDeclaration,
  getJsxTag,
  getObjectPropty,
  getStringExpression,
  getCallExpression,
  getArrowFunctionExpression,
  getIdentifierExpression
}