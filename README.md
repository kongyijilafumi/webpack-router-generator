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

| Property        | Type   | Default                                     | Descript                               |
| --------------- | ------ | ------------------------------------------- | -------------------------------------- |
| KeyWord         | String | "route"                                     | 捕获的路由信息的关键词。               |
| fileDir         | String | path.join(process.cwd(), "./src/pages")     | 需要从哪个文件夹中提取信息。           |
| comKey          | String | "component"                                 | 导出路由文件的 key。                   |
| outputFile      | String | path.join(process.cwd(), "./src/router.js") | 生成路由列表信息的文件路径。           |
| exts            | Array  | [".js", ".jsx", ".tsx", ".ts"]              | 需要匹配的文件后缀名                   |
| insertBeforeStr | String | ""                                          | 生成文件的插入字符，插入在列表变量之前 |
| insertAfterStr  | String | ""                                          | 生成文件的插入字符，插入在列表变量之后 |

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

如果 export const 暴露出的变量名类型为`数组格式`，需要自己定义`components`属性。他会原封不动的把数组里的每一项拼接起来，不会自动添加路径文件组件。

```js
// ./src/pages/test.js

// success type:Object
export const route = { tile: "test", path: "/test" };
// success type: Array
export const route = [
  { tile: "test", path: "/test", component: () => import("./pages/test.js") },
];
```

生成文件`./src/router.js`

```js
// ./src/router.js
const routes = [
  { title: "test", path: "/test", component: () => import("./pages/test.js") },
  // .....
];
export default routes;
```

### fileDir

根据此文件下的后缀名文件进行匹配，在此文件夹下`创建，修改，添加`可以成功匹配的后缀名文件且包含文件路由信息都会动态修改路由信息。

1. 文件匹配完生成的路由列表

```js
// ./src/router.js
const routes = [
  { title: "test", path: "/test", component:()=> import(".\\pages\\test.js") },
  // .....
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
  {
    title: "哈哈哈哈",
    path: "/test",
    component: () => import(".\\pages\\test.js"),
  },
];
export default routes;
```

### comKey

指定生成的导入路由信息的组件 key 值默认：`component`

```js
// ./src/router.js
const routes = [
  {
    title: "test",
    path: "/test",
    component: () => import(".\\pages\\test.js"),
  },
];
export default routes;
```

当`comKey`为其他值：`page`:

```js
// ./src/router.js
const routes = [
  { title: "test", path: "/test", page: () => import(".\\pages\\test.js") },
  // ....
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

### insertBeforeStr

需要插入生产文件变量之前的字符串。例如 insertBeforeStr 为`import React from "react"`,它将会变量之前显示。

```js
// 本文件为脚本自动生成，请勿修改
import React from "react";

const routes = [
  {
    //......
  },
];

export default routes;
```

### insertAfterStr

需要插入生产文件变量之后的字符串。例如 insertAfterStr 为`routes.push({title:"after",key:"after",component:()=>import("./pages/after.js")})`,它将会变量之后显示。

```js
// 本文件为脚本自动生成，请勿修改

const routes = [
  {
    //......
  },
];

routes.push({
  title: "after",
  key: "after",
  component: () => import("./pages/after.js"),
});
export default routes;
```

### 暴露出的路由信息

支持信息自定义，排序。

`Array类型` 会原封不动的把数据拼接到生成的列表了，需要自己手动添加文件路径信息等。

```js
// ./pages/index.js
// array
export const route = [
  {
    order: 1, // number  支持排序，越小越靠前，越大越靠后。 若无此项默认为 0 靠前
    path: "/",
  },
];
```

```js
// ./src/router.js
const routes = [
  {
    path: "/",
    order: 1,
  },
  {
    // .....
  },
];
```

`Object类型` 会自动添加当前文件与生成文件的相对路径。

```js
// ./pages/index.js
// object
export const route = {
  order: 1, // number  支持排序，越小越靠前，越大越靠后。 若无此项默认为 0 靠前
  path: "/",
};
```

```js
// ./src/router.js
const routes = [
  {
    order: 1,
    path: "/",
    component: () => import(".\\pages\\index.js"),
  },
  {
    // .....
  },
];
```
