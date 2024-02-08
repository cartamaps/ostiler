import * as fs from "node:fs";
import * as url from "node:url";

import { installGlobals } from "@remix-run/node";
import chalk from "chalk";
import closeWithGrace from "close-with-grace";
import sourceMapSupport from "source-map-support";

sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    const match = source.startsWith("file://");
    if (match) {
      const filePath = url.fileURLToPath(source);
      const sourceMapPath = `${filePath}.map`;
      if (fs.existsSync(sourceMapPath)) {
        return {
          url: source,
          map: fs.readFileSync(sourceMapPath, "utf8"),
        };
      }
    }
    return null;
  },
});

installGlobals();

closeWithGrace(async ({ err }) => {
  if (err) {
    console.error(chalk.red(err));
    console.error(chalk.red(err.stack));
    process.exit(1);
  }
});

if (process.env.NODE_ENV === "production") {
  await import("./server-build/index.js");
} else {
  await import("./server/index.ts");
}
