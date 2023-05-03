import { BigNumber, constants } from "ethers";
import { BasicOrder, TradeData } from "../types";

export const calculateEthValue = (tradeData: TradeData): BigNumber => {
  return tradeData.orders.reduce((sum: BigNumber, order: BasicOrder) => {
    if (order.currency === constants.AddressZero) {
      return BigNumber.from(order.price).add(sum);
    } else {
      return sum;
    }
  }, constants.Zero);
};
