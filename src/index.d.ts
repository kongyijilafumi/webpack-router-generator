
export interface Options {
  outputFile?: string;
  fileDir?: string;
  comKey?: string;
  keyWord?: string;
  routerVar?: string;
  exts?: string[];
  isLazy: boolean;
  insertBeforeStr?: string;
  insertAfterStr?: string;
}

declare class WebpackRouterGenerator {
  constructor(options?: Options)
}

export default WebpackRouterGenerator;