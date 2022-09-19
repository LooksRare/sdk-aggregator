import { SeaportConsideration } from "../../interfaces/seaport";
import { BigNumber, constants } from "ethers";

export default function calculatePriceFromConsideration(consideration: Array<SeaportConsideration>): BigNumber {
  return consideration.reduce(
    (sum: BigNumber, item: SeaportConsideration) => BigNumber.from(item.endAmount).add(sum),
    constants.Zero
  );
}
