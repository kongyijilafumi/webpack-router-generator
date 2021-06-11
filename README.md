# webpack-router-generator

A routing list is generated automatically according to the information defined in the file, which is used in webpack.(路由列表是根据文件中定义的信息自动生成的，用于 webpack)

## How to use? (如何使用)

To add a dependency to your project, use the following command.(在你的项目添加依赖，使用一下命令)

```shell
D:>npm i webpack-router-generator -D
# or 或者
D:>cnpm i webpack-router-generator -D
# or 或者
D:>yarn add webpack-router-generator -D
```

In your webpack plugins configuration, the code is as follows.(在你 webpack 的 plugins 配置中使用,代码如下.)

```js
// webpack.config.js
const path = require("path");
const WebpackRouterGenerator = require("webpack-router-generator");
const options = {
  KeyWord: "route",
  fileDir: path.join(process.cwd(), "./src/pages"),
  comKey: "component",
  outputFile: path.join(process.cwd(), "./src/router.js"),
  exts: [".js", ".jsx", ".tsx", ".ts"],
};
module.exports = {
  // ....
  plugins: [new WebpackRouterGenerator(options)],
};
```

## options's porperty(配置属性)

| Property   | Type   | Default                                     | Descript                                                                                                                                                                     |
| ---------- | ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KeyWord    | String | "route"                                     | 捕获的路由信息的关键词。                                                                                                                                                     |
| fileDir    | String | path.join(process.cwd(), "./src/pages")     | 需要从哪个文件夹中提取信息：默认为项目入口`src/pages`,在这个目录中 寻找符合条件后缀文件的将会从中提取信息.并且会监听这个文件夹符合后缀文件的`修改，删除，添加`都会更新路由。 |
| comKey     | String | "component"                                 | 导出路由文件的 key：当匹配到文件里有路由信息会记录该文件路径相对`输出文件`的`相对地址`生成路由信息`Object`的属性与值。如：`{ component: import(..\\pages\\test.js) }`。      |
| outputFile | String | path.join(process.cwd(), "./src/router.js") | 生成路由列表信息的文件路径：提取出的路由信息将会组合成一个`Array`类型暴露出去。如：`const routes = [{....},{....}]; export default routes;`                                  |
| exts       | Array  | [".js", ".jsx", ".tsx", ".ts"]              | 需要匹配的文件后缀名                                                                                                                                                         |

### KeyWord

告知查找的关键词信息，将会从文件中匹配 暴露出去的关键词获取路由信息,而且路由信息必须为`Object`类型。如下：

#### 使用 export default 暴露的数据查找原型属性与关键词匹配

```js
// ./src/pages/test.js
Class Test{
  //...
}

// success type:Object
Test.route = {
  tile:"test",
  path:"/test"
}

// fail type:Array
Test.route =[{
  tile:"test",
  path:"/test"
}]
```

#### 使用 export const 暴露的变量名与关键词匹配

```js
// ./src/pages/test.js

// success type:Object
export const route = { tile: "test", path: "/test" };
// fail type: not Object
export const route = { tile: "test", path: "/test" };
```

### fileDir

根据此文件下的后缀名文件进行匹配，在此文件夹下`创建，修改，添加`可以成功匹配的后缀名文件且包含文件路由信息都会动态修改路由信息。

1. 文件匹配完生成的路由列表

```js
// ./src/router.js
const routes = [
  { title: "test", path: "/test", component: import(".\\pages\\test.js") },
];
export default routes;

// -----------------

// ./src/pages/test.js
export default function Test() {
  return <div>test</div>;
}
Test.route = {
  title: "test",
  path: "/test",
};
```

2. 修改`./src/pages/test.js`

```js
// ./src/pages/test.js
export default function Test() {
  return <div>test</div>;
}
Test.route = {
  title: "哈哈哈哈",
  path: "/test",
};
```

路由文件会自动更新。

```js
// ./src/router.js
const routes = [
  { title: "哈哈哈哈", path: "/test", component: import(".\\pages\\test.js") },
];
export default routes;
```

### comKey

指定生成的导入路由信息的组件 key 值默认：`component`

```js
// ./src/router.js
const routes = [
  { title: "test", path: "/test", component: import(".\\pages\\test.js") },
];
export default routes;
```

当`comKey`为其他值：`page`:

```js
// ./src/router.js
const routes = [
  { title: "test", path: "/test", page: import(".\\pages\\test.js") },
];
export default routes;
```

### outputFile

生成的路由信息文件路径。默认路径：`your project/src/router.js`

### exts

需要从`fileDir`文件夹下哪些文件后缀提取路由信息。默认:`[".js", ".jsx", ".tsx", ".ts"]`

以下文件都会被提取。
```shell
./src/pages/index.js
./src/pages/test.jsx
./src/pages/demo.tsx
./src/pages/page.ts
```
