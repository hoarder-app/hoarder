import * as fs from "fs";

let content = fs.readFileSync("dist/index.mjs", "utf-8");
content = content.replace("0.0.0", process.env.npm_package_version!);
fs.writeFileSync("dist/index.mjs", content);
