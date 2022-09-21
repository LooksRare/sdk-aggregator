import { BigNumberish, BytesLike } from "ethers";

export enum ItemType {
  NATIVE = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
  ERC721_WITH_CRITERIA = 4,
  ERC1155_WITH_CRITERIA = 5,
}

export enum OrderType {
  FULL_OPEN = 0,
  PARTIAL_OPEN = 1,
  FULL_RESTRICTED = 2,
  PARTIAL_RESTRICTED = 3,
}

export interface Offer {
  itemType: ItemType;
  token: string;
  identifierOrCriteria: string;
  startAmount: number;
  endAmount: number;
}

export interface Consideration {
  itemType: ItemType;
  token: string;
  identifierOrCriteria: string;
  startAmount: number;
  endAmount: number;
  recipient: string;
}

export interface Parameters {
  offerer: string;
  zone: string;
  zoneHash: string;
  startTime: BigNumberish;
  endTime: BigNumberish;
  orderType: number;
  salt: string;
  conduitKey: string;
  nonce: string;
  offer: Offer[];
  consideration: Consideration[];
}

export interface Order {
  parameters: Parameters;
  signature: BytesLike;
}

export interface Recipient {
  amount: BigNumberish;
  recipient: string;
}

export interface OrderExtraData {
  numerator: number;
  denominator: number;
  orderType: OrderType;
  zone: string;
  zoneHash: string;
  salt: string;
  conduitKey: string;
  recipients: Array<Recipient>;
}

export interface FulfillmentComponent {
  orderIndex: number;
  itemIndex: number;
}

export const ORDER_EXTRA_DATA_SCHEMA = `
  tuple(
    uint120 numerator,
    uint120 denominator,
    uint8 orderType,
    address zone,
    bytes32 zoneHash,
    uint256 salt,
    bytes32 conduitKey,
    tuple(uint256 amount, address recipient)[] recipients
  ) orderExtraData
`;

export const EXTRA_DATA_SCHEMA = `
  tuple(
    tuple(uint256 orderIndex, uint256 itemIndex)[][] offerFulfillments,
    tuple(uint256 orderIndex, uint256 itemIndex)[][] considerationFulfillments
  )
`;