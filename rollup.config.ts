import commonjsPlugin from "@rollup/plugin-commonjs";
import typeScriptPlugin from "@rollup/plugin-typescript";
import path from "path";
import { defineConfig } from "rollup";
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

const isExternal = (id) => EXTERNALS_REGEX.test(id);

export default defineConfig({
  input: "lib/src/index.tsx",
  external: isExternal,
  output: [
    {
      file: path.join("build", packageJSON.module),
      format: "esm",
      sourcemap: true,
    },
    {
      file: path.join("build", packageJSON.main),
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
  ],
  plugins: [
    progressPlugin(),
    commonjsPlugin(),
    typeScriptPlugin({ tsconfig: "lib/tsconfig.json", exclude: ["lib/src/_propTypes.ts"] }),
    copyPlugin({
      targets: [
        { src: "lib/package.json", dest: "build" },
        { src: "README.md", dest: "build" },
        { src: "LICENSE", dest: "build" },
      ],
    }),
    deletePlugin({ targets: ["build/lib/**/*.d.ts", ...KEEP_TYPES], verbose: true, hook: "closeBundle" }),
  ],
});
