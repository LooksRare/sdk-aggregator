import { Order } from "@opensea/seaport-js/lib/types";
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from "ethers";
import { MakerOrderFromAPI } from "./interfaces/LooksRareV1";

/** List of supported chains */
export { SupportedChainId } from "@looksrare/sdk";

/** List of collection types supported by the aggregator */
export enum CollectionType {
  ERC721 = 0,
  ERC1155 = 1,
}

/** Basic order struct for each order in the TradeData object */
export interface BasicOrder {
  /** Transaction caller address */
  signer: string;
  /** NFT collection address */
  collection: string;
  /** Collection type, can be ERC721 or ERC1155 */
  collectionType: CollectionType;
  /** Token IDs */
  tokenIds: BigNumberish[];
  /** Each token ID's amounts, must be 1 if ERC721 */
  amounts: BigNumberish[];
  /** Price of the trade */
  price: BigNumberish;
  /** The currency of the trade, the value is 0 if ETH */
  currency: string;
  /** The timestamp when the order becomes valid */
  startTime: BigNumberish;
  /** The timestamp when the order stops being valid */
  endTime: BigNumberish;
  /** The maker ask's signature */
  signature: BytesLike;
}

/** A trade object for the aggregator to process.  Each TradeData represents a batched order for a marketplace. */
export interface TradeData {
  /** The marketplace proxy's contract address */
  proxy: string;
  /** The 4 bytes function selector to call the proxy */
  selector: string;
  /** The orders to be executed by the proxy */
  orders: BasicOrder[];
  /** Extra data for each order to be executed by the proxy */
  ordersExtraData: BytesLike[];
  /** Extra data for the whole transaction to be submitted to the marketplace */
  extraData: BytesLike;
}

/** Aggregated ERC20 token transfer instruction for the aggregator to execute */
export interface TokenTransfer {
  /** Amount of tokens to send */
  amount: BigNumber;
  /** Token address */
  currency: string;
}

/** Pre-processed listings data coming from each marketplace's API */
export interface Listings {
  /** Seaport listings retrieved from OpenSea's API */
  seaport: Order[];
  /** LooksRare V1's listings retrieved from LooksRare's API */
  looksRareV1: MakerOrderFromAPI[];
}

/** Processed marketplace trade data together with the actions required before executing a trade */
export interface TransformListingsOutput {
  /** An array of TradeData for the aggregator to process. Each TradeData represents a batched order for a marketplace */
  tradeData: TradeData[];
  /** Contract transactions that must be executed before actually executing the trade */
  actions: Array<() => Promise<ContractTransaction>>;
}
