import { BigNumber, BigNumberish, BytesLike, Signer } from "ethers";
import { TypedDataSigner } from "@ethersproject/abstract-signer";

export type Signer = Signer & TypedDataSigner;

export enum SupportedChainId {
  MAINNET = 1,
  GOERLI = 5,
  HARDHAT = 31337,
}

export enum CollectionType {
  ERC721 = 0,
  ERC1155 = 1,
}

export interface BasicOrder {
  signer: string;
  collection: string;
  collectionType: CollectionType;
  tokenIds: BigNumberish[];
  amounts: BigNumberish[];
  price: BigNumberish;
  currency: string;
  startTime: BigNumberish;
  endTime: BigNumberish;
  signature: BytesLike;
}

export interface TradeData {
  proxy: string;
  selector: string;
  value: BigNumber;
  orders: BasicOrder[];
  ordersExtraData: BytesLike[];
  extraData: BytesLike;
}

export interface TokenTransfer {
  amount: BigNumber;
  currency: string;
}
