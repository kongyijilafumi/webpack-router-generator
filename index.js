const fs = require("fs");
const chokidar = require("chokidar");
const babelc = require("@babel/core");
const babelt = require("@babel/types");
const path = require("path");

class WebpackRouterGenerator {
  constructor({
    KeyWord,
    fileDir,
    comKey,
    outputFile,
    exts,
    insertBeforeStr,
    insertAfterStr,
  }) {
    this.KeyWord = KeyWord || "route";
    this.fileDir = fileDir || path.join(process.cwd(), "./src/pages");
    this.outputFile = outputFile || path.join(process.cwd(), "./src/router.js");
    this.comKey = comKey || "component";
    this.files = [];
    this.exts = exts || [".js", ".jsx", ".tsx", ".ts"];
    this.watchFile = [];
    this.routerVar = "routes";
    this.isWatch = false;
    this.insertBeforeStr = insertBeforeStr || "";
    this.insertAfterStr = insertAfterStr || "";
  }

  apply(compiler) {
    compiler.hooks.environment.tap("WebpackRouterGenerator", () => {
      this.writeRouteFile();
      this.wacth(compiler);
    });
  }
  // 写入数据到输出文件
  writeRouteFile() {
    this.files = [];
    try {
      this.readPath(this.fileDir);
    } catch (error) {
      console.error(
        "WebpackRouterGenerator[warning]:in writeRouteFile " + error
      );
      return;
    }
    if (this.files.length === 0) {
      console.warn("WebpackRouterGenerator[warning]:未找到需要提取信息的文件");
      return;
    }
    try {
      let routerInfo = this.getAllInfo() || `const ${this.routerVar} = []`;
      let tempStr = `
// 本文件为脚本自动生成，请勿修改
${this.insertBeforeStr}

${routerInfo}

${this.insertAfterStr}

export default ${this.routerVar}`;
      fs.writeFileSync(this.outputFile, tempStr, "utf8");
    } catch (err) {
      console.error("WebpackRouterGenerator[error]:in getAllInfo " + err);
    }
  }

  // 启动监听
  wacth(compiler) {
    compiler.hooks.watchRun.tap("WebpackRouterGenerator", () => {
      if (this.isWatch) {
        return;
      }
      this.isWatch = true;
      let timer;
      const watchFileType = path.join(
        this.fileDir,
        `**/*.{${this.exts.map((i) => i.replace(".", "")).join(",")}}`
      );
      const hasFils = new Set();
      const watchEvent = ["add", "unlink", "change"];
      chokidar.watch([watchFileType], {}).on("all", (eventName, filepath) => {
        if (watchEvent.includes(eventName)) {
          const hasData = this.hasRouteConfig(this.getString(filepath));
          if (!hasData && !hasFils.has(filepath)) {
            return;
          } else if (!hasData && hasFils.has(filepath)) {
            hasFils.delete(filepath);
          } else if (hasData && !hasFils.has(filepath)) {
            hasFils.add(filepath);
          }
          clearTimeout(timer);
          console.log(
            "WebpackRouterGenerator[info]:" +
              filepath +
              "发生改变，1s后更新路由"
          );
          timer = setTimeout(() => {
            this.writeRouteFile();
          }, 1000);
        }
      });
    });
  }
  /**
   * 返回捕获到的信息
   * @returns {Object|null}
   */
  getAllInfo() {
    let nodes = [],
      wfilse = [];
    this.files.forEach((filepath) => {
      let node = this.getRouterInfo(filepath);
      if (node && node.length) {
        let time = this.getFileMtime(filepath);
        wfilse.push({
          time,
          filepath,
        });
        nodes.push(...node);
      }
    });
    if (nodes.length === 0) {
      console.warn(
        "WebpackRouterGenerator[warning]:未提取出文件暴露的路由信息！"
      );
      return null;
    }
    this.watchFile = wfilse;
    nodes.sort((a, b) => this.sortNode(a) - this.sortNode(b));
    return this.getRouterString(nodes, this.outputFile);
  }

  /**
   * 将多个ast树的 合并成js 变量 返回字符串
   * @param {Array} nodes 多文件的ast树提取出的信息
   * @param {String} outputFile 文件路径
   * @returns {String}
   */
  getRouterString(nodes, outputFile) {
    const ast = babelt.file(
      babelt.program([
        babelt.variableDeclaration("const", [
          babelt.variableDeclarator(
            babelt.identifier(this.routerVar),
            babelt.arrayExpression(nodes)
          ),
        ]),
      ]),
      "",
      ""
    );
    return babelc.transformFromAstSync(ast, "", { filename: outputFile }).code;
  }

  // 节点排序
  sortNode(node) {
    if (!node.properties) {
      return 0;
    }
    const sortNode = node.properties.find((i) => {
      if (!babelt.isObjectProperty(i)) {
        return false;
      }
      return i.key.name === "order";
    });
    if (sortNode) {
      if (babelt.isNumericLiteral(sortNode.value)) {
        return sortNode.value.value;
      }
      if (babelt.isUnaryExpression(sortNode.value)) {
        const { value } = sortNode;
        return Number(value.operator + value.argument.value);
      }
    }
    return 0;
  }

  hasRouteConfig(data) {
    return new RegExp(
      `(export\\s+const\\s+${this.KeyWord})|([\\w]+\\.${this.KeyWord})`
    ).test(data);
  }

  /**
   * 文件是否存在
   * @param {String} path 文件路径
   * @returns
   */
  isFileLink(path) {
    return fs.existsSync(path);
  }

  /**
   * 获取文件时间戳
   * @param {String} path 文件路径
   * @returns {Number}
   */
  getFileMtime(path) {
    return fs.statSync(path).mtime;
  }

  /**
   * 读取文件路径 解析出文件里的关键词定义的信息。
   * @param {String} filepath 文件路径
   * @returns {Object|null} 返回ast树，需要babel转换成 js
   */
  getRouterInfo(filepath) {
    // 定义 () => import(....)
    let relativePath = path.join(
      path.relative(path.dirname(this.outputFile), this.fileDir),
      path.relative(this.fileDir, filepath)
    );
    const routeFunction = babelt.arrowFunctionExpression(
      [],
      babelt.callExpression(babelt.identifier("import"), [
        babelt.stringLiteral(relativePath),
      ])
    );
    // obj 的 属性与值  component : import(filepath)
    const componentNode = babelt.objectProperty(
      babelt.identifier(this.comKey),
      routeFunction
    );
    const ast = babelc.parseSync(this.getString(filepath), {
      filename: filepath,
      presets: [[require.resolve("@a8k/babel-preset"), { target: "web" }]],
    });
    // ast 文件主体
    const { body } = ast.program;
    // 是否有 export default
    const defaultDeclaration = body.find((node) => {
      if (babelt.isExportDefaultDeclaration(node)) {
        return true;
      }
      return false;
    });
    // 是否有 `export const ${this.KeyWord} = {  ...  }`
    const routesDeclaration = body.find((node) => {
      if (
        babelt.isExportNamedDeclaration(node) &&
        babelt.isVariableDeclaration(node.declaration) &&
        babelt.isVariableDeclarator(node.declaration.declarations[0]) &&
        this.KeyWord === node.declaration.declarations[0].id.name &&
        (babelt.isObjectExpression(node.declaration.declarations[0].init) ||
          babelt.isArrayExpression(node.declaration.declarations[0].init))
      ) {
        return true;
      }
      return false;
    });
    // 获取 定义的部分 没有返回null
    let routerData;
    if (routesDeclaration) {
      // 获取  export const routes 声明的部分
      routerData = routesDeclaration.declaration.declarations[0].init;
    } else if (defaultDeclaration) {
      let name = null;
      const { declaration } = defaultDeclaration;
      if (
        babelt.isFunctionDeclaration(declaration) ||
        babelt.isClassDeclaration(declaration)
      ) {
        name = declaration.id.name;
      } else if (babelt.isIdentifier(declaration)) {
        name = declaration.name;
      }
      if (!name) {
        return null;
      }
      // 获取  export default  声明的部分
      const routerNode = this.findRouterNode(body, name);
      if (!routerNode) {
        return null;
      }
      routerData = routerNode.expression.right;
    }
    const isAarrayNode = babelt.isArrayExpression(routerData);
    if (!isAarrayNode) {
      routerData.properties.push(componentNode);
    }
    return isAarrayNode ? routerData.elements : [routerData];
  }

  // 寻找 节点下的 pro
  findRouterNode(body, name) {
    return body.find((node) => {
      if (babelt.isExpressionStatement(node)) {
        const { left } = node.expression;
        if (
          babelt.isMemberExpression(left) &&
          babelt.isIdentifier(left.object)
        ) {
          if (
            left.object.name === name &&
            babelt.isIdentifier(left.property) &&
            this.KeyWord === left.property.name
          ) {
            return true;
          }
        }
      }
      return false;
    });
  }

  /**
   * 返回是否为文件
   * @param {String} path 文件路径
   * @returns {Boolean}
   */
  isFile(path) {
    return fs.statSync(path).isFile();
  }

  /**
   * 返回是否为文件夹
   * @param {String} path 文件路径
   * @returns {Boolean}
   */
  isDir(path) {
    return fs.statSync(path).isDirectory();
  }

  /**
   * 读取文件路径，返回该路径的文件夹和文件
   * @param {String} path 文件路径
   * @returns {Array}
   */
  readDir(path) {
    return fs.readdirSync(path);
  }

  /**
   * 递归获取文件，包含在定义的this.exts 后缀名 符合要求的被存入 this.files
   * @param {String} appPath 文件路径
   */
  readPath(appPath) {
    if (this.isDir(appPath)) {
      this.readDir(appPath).forEach((file) =>
        this.readPath(path.join(appPath, file))
      );
      return;
    }
    if (this.isFile(appPath) && this.exts.includes(path.extname(appPath))) {
      this.files.push(appPath);
      return;
    }
  }

  getString(path) {
    if (!fs.existsSync(path)) {
      return null;
    }
    return fs.readFileSync(path, "utf8");
  }
}

module.exports = WebpackRouterGenerator;
