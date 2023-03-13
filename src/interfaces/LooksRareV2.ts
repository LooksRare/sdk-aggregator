import { MerkleTree } from "@looksrare/sdk-v2";
import { BigNumberish, BytesLike } from "ethers";
import { CollectionType } from "../types";

export enum QuoteType {
  Bid = 0,
  Ask = 1,
}

type OrderStatus = "CANCELLED" | "EXECUTED" | "EXPIRED" | "VALID";

export interface MakerOrderFromAPI {
  quoteType: QuoteType;
  globalNonce: BigNumberish;
  subsetNonce: BigNumberish;
  orderNonce: BigNumberish;
  collection: string;
  collectionType: CollectionType;
  strategy: BigNumberish;
  currency: string;
  signer: string;
  startTime: BigNumberish;
  endTime: BigNumberish;
  price: BigNumberish;
  additionalParameters: BytesLike;
  signature: string;
  status: OrderStatus;
  itemIds: BigNumberish[];
  amounts: BigNumberish[];
  merkleTree: MerkleTree;
  hash: string;
}

/** LooksRare order extra data object inside TradeData */
export interface OrderExtraData {
  merkleTree: MerkleTree;
  globalNonce: BigNumberish;
  subsetNonce: BigNumberish;
  orderNonce: BigNumberish;
  strategyId: BigNumberish;
  price: BigNumberish;
  takerBidAdditionalParameters: BytesLike;
  makerAskAdditionalParameters: BytesLike;
}

export const ORDER_EXTRA_DATA_SCHEMA = [
  `
    tuple(
      tuple(
        bytes32 root,
        tuple(bytes32 value, uint8 position)[] proof
      ) merkleTree,
      uint256 globalNonce,
      uint256 subsetNonce,
      uint256 orderNonce,
      uint256 strategyId,
      uint256 price,
      bytes takerBidAdditionalParameters,
      bytes makerAskAdditionalParameters
    ) orderExtraData
  `,
];
