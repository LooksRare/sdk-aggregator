import * as fs from "fs";
import * as path from "path";

const getFixture = (market: string, filename: string): Record<string, any> =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, `../fixtures/${market}/${filename}`), { encoding: "utf8", flag: "r" })
  );

export default getFixture;
