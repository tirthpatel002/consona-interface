/// <reference types="vite/client" />
/// <reference path="../../src/global.d.ts" />

declare module '*.md?raw' {
  const content: string
  export default content
}

declare module '*.md' {
  const content: string
  export default content
}
