import commonjsPlugin from "@rollup/plugin-commonjs";
import typeScriptPlugin from "@rollup/plugin-typescript";
import path from "path";
import { defineConfig } from "rollup";
import analyzerPlugin from "rollup-plugin-analyzer";
import cleanupPlugin from "rollup-plugin-cleanup";
import copyPlugin from "rollup-plugin-copy";
import deletePlugin from "rollup-plugin-delete";
import progressPlugin from "rollup-plugin-progress";
import packageJSON from "./lib/package.json";

const EXTERNALS = Object.keys({
  ...packageJSON.dependencies,
  ...packageJSON.peerDependencies,
}).concat(["clsx"]);

const EXTERNALS_REGEX = new RegExp(EXTERNALS.join("|"));

const KEEP_TYPES = [
  "index.d.ts",
  "table.types.d.ts",
  "utils.d.ts",
  "_dataTable.consts.d.ts",
  "Fields/SimpleSelect.component.d.ts",
].map((path) => `!build/lib/${path}`);

export default defineConfig({
  input: "lib/src/index.tsx",
  external: EXTERNALS_REGEX,
  output: {
    entryFileNames: path.basename(packageJSON.module),
    chunkFileNames: "chunk-[hash].js",
    inlineDynamicImports: false,
    dir: "build/lib",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    progressPlugin(),
    commonjsPlugin(),
    typeScriptPlugin({
      tsconfig: "lib/tsconfig.json",
      exclude: ["lib/src/_propTypes.ts"],
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
    deletePlugin({ targets: ["build/lib/**/*.d.ts", ...KEEP_TYPES], hook: "closeBundle" }),
  ],
});
