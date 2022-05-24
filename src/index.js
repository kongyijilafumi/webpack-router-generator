const path = require("path")
const chokidar = require("chokidar")
const { writeFileSync } = require("fs")

const { getNormaPath, getRelativePath, getTagName, log, isExists } = require("./utils");
const {
  getObjectPropty,
  getArrowFunctionExpression,
  getCallExpression,
  getIdentifierExpression,
  getStringExpression,
  getJsxTag,
  getImportDeclaration,
  getAstCodeStr
} = require("./generator");
const { getRouteInfoNode, getRouterString, isObjectExpression, sortNode } = require("./parse");
const options = {
  keyWord: "route",
  fileDir: path.join(process.cwd(), "./src/pages"),
  comKey: "component",
  outputFile: path.join(process.cwd(), "./src/router.js"),
  exts: [".js", ".jsx", ".tsx"],
  insertBeforeStr: '',
  insertAfterStr: '',
  isLazy: true
}
module.exports = class WebpackRouterGenerator {
  constructor(o) {
    const opt = Object.assign(options, o)
    this.keyWord = opt.keyWord;
    this.fileDir = opt.fileDir;
    this.outputFile = opt.outputFile
    this.comKey = opt.comKey
    this.exts = opt.exts
    this.watchFile = [];
    this.routerVar = "routes";
    this.insertBeforeStr = opt.insertBeforeStr;
    this.insertAfterStr = opt.insertAfterStr;
    this.isLazy = opt.isLazy

    this.nodes = [];
    this.nodeMap = new Map()
    this.timer = null
    this.watcher = null
  }



  getLazyCompnentNode(filePath) {
    return getObjectPropty(
      this.comKey,
      getArrowFunctionExpression(
        [],
        getCallExpression(
          getIdentifierExpression("import"),
          [getStringExpression(filePath)]
        )
      )
    )
  }

  getCompnentNode(tagName) {
    return getObjectPropty(this.comKey, getJsxTag(tagName))
  }
  setCurrentPageNode(filePath) {
    const routerNode = getRouteInfoNode(filePath, this.keyWord)
    if (!routerNode) {
      this.nodeMap.set(getNormaPath(filePath), null)
      return null
    }
    const relative = getNormaPath(getRelativePath(this.outputFile, filePath), false)
    const tagName = getTagName(relative)
    const componentNode = this.isLazy ? this.getLazyCompnentNode(relative) : this.getCompnentNode(tagName)
    const isObjectNode = isObjectExpression(routerNode)

    if (!isObjectNode) {
      log("warn", "提取的路由信息必须为Object类型，例如：{ key:val }")
      return null
    }
    routerNode.properties.push(componentNode)
    const mapData = {
      node: routerNode,
      filePath,
      relative
    }
    this.nodeMap.set(getNormaPath(filePath), mapData)
    return routerNode
  }
  getImportStr() {
    if (this.isLazy) {
      return ''
    }
    const nodes = []
    this.nodeMap.forEach((value) => {
      if (value) {
        nodes.push(value)
      }
    })
    const importNode = nodes.map(item => {
      const tagName = getTagName(item.relative)
      return getImportDeclaration(tagName, item.relative)
    })
    return getAstCodeStr(importNode)
  }
  getTmpStr(routerStr, importStr) {
    return `// 本文件为脚本自动生成，请勿修改
${importStr}

${this.insertBeforeStr || ''}
    
${routerStr}
    
${this.insertAfterStr || ''}
    
export default ${this.routerVar}`
  }
  setNodes() {
    const { nodeMap } = this
    const nodes = []
    nodeMap.forEach((value) => {
      if (value) {
        nodes.push(value.node)
      }
    })
    nodes.sort((a, b) => sortNode(a, "order") - sortNode(b, "order"))
    this.nodes = nodes
  }
  writeFile() {
    const { outputFile, routerVar, nodes } = this
    if (nodes.length === 0) {
      log("warn", "未提取出文件暴露的路由信息！")
      return
    }
    const genStr = getRouterString(nodes, routerVar) || `const ${routerVar} = []`
    const genImportStr = this.getImportStr()
    const tmpStr = this.getTmpStr(genStr, genImportStr)
    try {
      writeFileSync(outputFile, tmpStr, "utf8");
    } catch (error) {
      log("warn", "写入路由信息失败:" + error)
    }
  }
  watch() {
    const hasDir = isExists(this.fileDir)
    if (!hasDir) {
      return log("warn", "未发现目标监听文件")
    }
    const watchFileType = path.join(
      this.fileDir,
      `**/*.{${this.exts.map((i) => i.replace(".", "")).join(",")}}`
    );

    const watchEvent = ["add", "unlink", "change"];
    this.watcher = chokidar.watch([watchFileType], {}).on("all", (eventName, filePath) => {
      if (!watchEvent.includes(eventName)) return
      const hasNode = this.setCurrentPageNode(filePath)
      if (!hasNode && eventName !== "unlink") return
      clearTimeout(this.timer)
      log("log", `${eventName} ${filePath} 1s后更新路由文件！`)
      this.timer = setTimeout(() => {
        this.setNodes()
        this.writeFile()
      }, 1000);
    })
  }
  apply(compiler) {
    compiler.hooks.environment.tap("WebpackRouterGenerator", () => {
      this.watch()
    });
  }
}
