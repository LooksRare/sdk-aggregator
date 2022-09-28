import { Order } from "@opensea/seaport-js/lib/types";
import { BigNumber, BigNumberish, BytesLike, ContractTransaction } from "ethers";
import { MakerOrderFromAPI } from "./interfaces/LooksRareV1";

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

export interface Listings {
  seaport: Order[];
  looksRareV1: MakerOrderFromAPI[];
}

export interface TransformListingsOutput {
  tradeData: TradeData[];
  actions: Array<() => Promise<ContractTransaction>>;
}
