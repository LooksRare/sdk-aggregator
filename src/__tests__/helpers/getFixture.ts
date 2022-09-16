import * as fs from "fs";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (market: string, filename: string): any =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, `../fixtures/${market}/${filename}`), { encoding: "utf8", flag: "r" })
  );
