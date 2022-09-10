import commonjsPlugin from "@rollup/plugin-commonjs";
import typeScriptPlugin from "@rollup/plugin-typescript";
import path from "path";
import { defineConfig } from "rollup";
import analyzerPlugin from "rollup-plugin-analyzer";
import cleanupPlugin from "rollup-plugin-cleanup";
import copyPlugin from "rollup-plugin-copy";
import progressPlugin from "rollup-plugin-progress";
import packageJSON from "./lib/package.json";

const EXTERNALS = Object.keys({
  ...packageJSON.dependencies,
  ...packageJSON.peerDependencies,
}).concat(["clsx"]);

const EXTERNALS_REGEX = new RegExp(EXTERNALS.join("|"));

export default defineConfig({
  input: "lib/src/index.tsx",
  external: EXTERNALS_REGEX,
  output: [
    {
      entryFileNames: path.basename(packageJSON.module),
      chunkFileNames: "chunk-[hash].js",
      inlineDynamicImports: false,
      dir: "build/lib",
      format: "esm",
      sourcemap: true,
    },
    {
      entryFileNames: path.basename(packageJSON.main),
      chunkFileNames: "chunk-[hash].c.js",
      inlineDynamicImports: false,
      dir: "build/lib",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
  ],
  plugins: [
    progressPlugin(),
    commonjsPlugin(),
    typeScriptPlugin({
      tsconfig: "lib/tsconfig.json",
      outDir: "build/lib",
    }),
    copyPlugin({
      targets: [
        { src: "lib/package.json", dest: "build" },
        { src: "README.md", dest: "build" },
        { src: "LICENSE", dest: "build" },
      ],
    }),
    cleanupPlugin({ extensions: ["js", "jsx", "ts", "tsx"] }),
    analyzerPlugin(),
  ],
});
