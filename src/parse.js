const { getAstCodeStr } = require("./generator")
const babelt = require("@babel/types")
const { isExists } = require("./utils")
const fs = require("fs")
const { parse } = require("@babel/parser")

function getRouterString(nodes, routerVar) {
  return getAstCodeStr([
    babelt.variableDeclaration("const", [
      babelt.variableDeclarator(
        babelt.identifier(routerVar),
        babelt.arrayExpression(nodes)
      ),
    ]),
  ])
}

function getFileAstNode(filePath) {
  const hasExist = isExists(filePath)
  if (!hasExist) {
    return null
  }
  const str = fs.readFileSync(filePath, "utf-8")
  if (!str) {
    return null
  }
  try {
    const { program } = parse(str, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    })
    if (!program.body.length) {
      return null
    }
    return program.body
  } catch (error) {
    return null
  }

}

function hasExportDefaultNode(node) {
  const hasDefaultNode = babelt.isExportDefaultDeclaration(node)
  if (!hasDefaultNode) {
    return false
  }
  const isFn = babelt.isFunctionDeclaration(node.declaration)
  const isClass = babelt.isClassDeclaration(node.declaration)
  if ((isFn || isClass) && node.declaration.id) {
    return node.declaration.id.name
  }
  const isIdentifier = babelt.isIdentifier(node.declaration)
  if (isIdentifier) {
    return node.declaration.name
  }
  return false
}

function hasExportNameNode(node, keyWord) {
  const isExportName = babelt.isExportNamedDeclaration(node)
  if (!isExportName) {
    return false
  }
  if (node.declaration && node.declaration.declarations) {
    return node.declaration.declarations.find(declarations => {
      return declarations.id.name === keyWord && babelt.isObjectExpression(declarations.init)
    })
  }
  return false
}

function getDefaultRouteNode(nodes, defaultName, keyWord) {
  return nodes.find(node => {
    if (
      babelt.isExpressionStatement(node) &&
      node.expression.left &&
      babelt.isMemberExpression(node.expression.left) &&
      babelt.isIdentifier(node.expression.left.object) &&
      node.expression.left.object.name === defaultName &&
      babelt.isIdentifier(node.expression.left.property) &&
      node.expression.left.property.name === keyWord
    ) {
      return true
    }
    return false
  })
}

function getRouteInfoNode(filePath, keyWord) {
  const astNodes = getFileAstNode(filePath)
  if (!astNodes) {
    return null
  }
  let defaultName, exportNameNode;
  astNodes.forEach(node => {
    if (!defaultName && (defaultName = hasExportDefaultNode(node))) {
      return
    }
    if (!exportNameNode && (exportNameNode = hasExportNameNode(node, keyWord))) {
      return
    }
  })
  if (exportNameNode) {
    return exportNameNode.init
  }
  if (defaultName) {
    const defaultNode = getDefaultRouteNode(astNodes, defaultName, keyWord)
    if (defaultNode) {
      return defaultNode.expression.right
    }
  }
  return null
}

function sortNode(node, orderName) {
  if (!node.properties) {
    return 0;
  }
  const orderNode = node.properties.find((i) => {
    if (!babelt.isObjectProperty(i)) {
      return false;
    }
    return i.key.name === orderName;
  });
  if (orderNode) {
    if (babelt.isNumericLiteral(orderNode.value)) {
      return orderNode.value.value;
    }
    if (babelt.isUnaryExpression(orderNode.value)) {
      const { value } = orderNode;
      return Number(value.operator + value.argument.value);
    }
  }
  return 0;
}

function isObjectExpression(node) {
  return babelt.isObjectExpression(node)
}

module.exports = {
  getRouterString, isObjectExpression, sortNode, getRouteInfoNode
}