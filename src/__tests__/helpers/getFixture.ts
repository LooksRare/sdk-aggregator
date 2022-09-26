import * as fs from "fs";
import * as path from "path";

export default (market: string, filename: string): Record<string, any> =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, `../fixtures/${market}/${filename}`), { encoding: "utf8", flag: "r" })
  );
