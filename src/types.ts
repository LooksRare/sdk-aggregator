import { Order } from "@opensea/seaport-js/lib/types";
import { BigNumber, BigNumberish, BytesLike, ContractTransaction, PayableOverrides, UnsignedTransaction } from "ethers";
import { MakerOrderFromAPI } from "./interfaces/LooksRareV2";

/** LooksRare aggregator contract addresses */
export interface Addresses {
  AGGREGATOR: string;
  ERC20_ENABLED_AGGREGATOR: string;
  LOOKSRARE_V2_PROXY: string;
  SEAPORT_V1_4_PROXY: string;
  SEAPORT_V1_5_PROXY: string;
}

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
  /** Seaport V1.4 listings retrieved from OpenSea's API */
  seaport_V1_4: Order[];
  /** Seaport V1.5 listings retrieved from OpenSea's API */
  seaport_V1_5: Order[];
  /** LooksRare V2's listings retrieved from LooksRare's API */
  looksRareV2: MakerOrderFromAPI[];
}

/** Processed marketplace trade data together with the actions required before executing a trade */
export interface TransformListingsOutput {
  /** An array of TradeData for the aggregator to process. Each TradeData represents a batched order for a marketplace */
  tradeData: TradeData[];
  /** Contract transactions that must be executed before actually executing the trade */
  actions: Array<() => Promise<ContractTransaction>>;
}

/** Return type for any on chain call */
export interface ContractMethods {
  call: (additionalOverrides?: PayableOverrides) => Promise<ContractTransaction>;
  callStatic: (additionalOverrides?: PayableOverrides) => Promise<any>;
  estimateGas: (additionalOverrides?: PayableOverrides) => Promise<BigNumber>;
  populateTransaction: (additionalOverrides?: PayableOverrides) => Promise<UnsignedTransaction>;
}
