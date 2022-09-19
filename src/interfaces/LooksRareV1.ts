import { MakerOrderWithSignature } from "@looksrare/sdk";
import { BigNumberish } from "ethers";

export interface MakerOrderFromAPI extends Omit<MakerOrderWithSignature, "collection" | "currency"> {
  collectionAddress: string;
  currencyAddress: string;
}

export interface OrderExtraData {
  makerAskPrice: BigNumberish;
  minPercentageToAsk: BigNumberish;
  nonce: BigNumberish;
  strategy: string;
}

export const ORDER_EXTRA_DATA_SCHEMA = ["uint256", "uint256", "uint256", "address"];