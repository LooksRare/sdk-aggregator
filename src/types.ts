import { BigNumberish, BytesLike } from "ethers";

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
  address: string;
  selector: string;
  value: BigNumberish;
  orders: BasicOrder[];
  ordersExtraData: BytesLike[];
  extraData: BytesLike;
}