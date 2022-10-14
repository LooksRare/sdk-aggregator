import { MakerOrderWithSignature } from "@looksrare/sdk";
import { BigNumberish } from "ethers";

/** LooksRare order object from the API */
export interface MakerOrderFromAPI extends Omit<MakerOrderWithSignature, "collection" | "currency"> {
  /** NFT collection address */
  collectionAddress: string;
  /** Payment currency address */
  currencyAddress: string;
}

/** LooksRare order extra data object inside TradeData */
export interface OrderExtraData {
  /** Maker ask price */
  makerAskPrice: BigNumberish;
  /** Min percentage to ask for slippage protection */
  minPercentageToAsk: BigNumberish;
  /** Order maker's nonce */
  nonce: BigNumberish;
  /** Trade execution strategy address */
  strategy: string;
}

export const ORDER_EXTRA_DATA_SCHEMA = ["uint256", "uint256", "uint256", "address"];
