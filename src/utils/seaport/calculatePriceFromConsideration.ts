import { Consideration } from "../../interfaces/Seaport";
import { BigNumber, constants } from "ethers";

export default function calculatePriceFromConsideration(consideration: Array<Consideration>): BigNumber {
  return consideration.reduce(
    (sum: BigNumber, item: Consideration) => BigNumber.from(item.endAmount).add(sum),
    constants.Zero
  );
}
