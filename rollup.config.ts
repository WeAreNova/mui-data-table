import commonjsPlugin from "@rollup/plugin-commonjs";
import nodeResolvePlugin from "@rollup/plugin-node-resolve";
import typeScriptPlugin from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import peerDepsExternalPlugin from "rollup-plugin-peer-deps-external";
import progressPlugin from "rollup-plugin-progress";
import packageJSON from "./package.json";

export default defineConfig({
  input: "./src/lib/index.tsx",
  output: [
    {
      file: packageJSON.module,
      format: "esm",
      sourcemap: true,
    },
    {
      file: packageJSON.main,
      format: "cjs",
      sourcemap: true,
      exports: "auto",
    },
  ],
  plugins: [
    peerDepsExternalPlugin(),
    progressPlugin(),
    nodeResolvePlugin(),
    commonjsPlugin(),
    typeScriptPlugin({ tsconfig: "./tsconfig.build.json" }),
  ],
});
