import { MakerOrderWithSignature } from "@looksrare/sdk";
import { BigNumberish } from "ethers";
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
  additionalParameters: string;
  signature: string;
  status: OrderStatus;
  itemIds: [BigNumberish];
  amounts: [BigNumberish];
}

enum MerkleTreeNodePosition {
  Left = 0,
  Right = 1,
}

interface MerkleTreeNode {
  value: string;
  position: MerkleTreeNodePosition;
}

export interface MerkleTree {
  root: string;
  proof: MerkleTreeNode[];
}

/** LooksRare order extra data object inside TradeData */
export interface OrderExtraData {
  merkleTree: MerkleTree;
  globalNonce: BigNumberish;
  subsetNonce: BigNumberish;
  orderNonce: BigNumberish;
  strategyId: BigNumberish;
  price: BigNumberish;
  takerBidAdditionalParameters: string;
  makerAskAdditionalParameters: string;
}

export const ORDER_EXTRA_DATA_SCHEMA = [
  `
    tuple(
      bytes32 root,
      tuple(bytes32 value, uint8 position)[] proof
    ) merkleTree
  `,
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "bytes",
  "bytes",
];