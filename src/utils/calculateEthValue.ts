import { BigNumber, constants } from "ethers";
import { BasicOrder, TradeData } from "../types";
import { Addresses } from "../constants/addresses";

export const calculateEthValue = (tradeData: TradeData, addresses: Addresses): BigNumber => {
  if (tradeData.proxy === addresses.LOOKSRARE_V1_PROXY) {
    return tradeData.orders.reduce((sum: BigNumber, order: BasicOrder) => {
      return BigNumber.from(order.price).add(sum);
    }, constants.Zero);
  } else if (tradeData.proxy === addresses.SEAPORT_PROXY) {
    return tradeData.orders.reduce((sum: BigNumber, order: BasicOrder) => {
      if (order.currency === constants.AddressZero) {
        return BigNumber.from(order.price).add(sum);
      } else {
        return sum;
      }
    }, constants.Zero);
  } else {
    return constants.Zero;
  }
};