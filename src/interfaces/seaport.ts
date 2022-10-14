import { OrderType } from "@opensea/seaport-js/lib/constants";
import { BigNumberish } from "ethers";

/** The recipient of a sales' proceed */
export interface Recipient {
  /** Receive amount */
  amount: BigNumberish;
  /** Recipient address */
  recipient: string;
}

/** Seaport order extra data object inside TradeData */
export interface OrderExtraData {
  /** Seaport trade numerator, it should be 1 for ERC721 and variable for ERC1155 */
  numerator: number;
  /** Seaport trade denominator, it should be 1 for ERC721 and variable for ERC1155 */
  denominator: number;
  /** Seaport order type */
  orderType: OrderType;
  /** Seaport zone contract address */
  zone: string;
  /** Seaport zone hash */
  zoneHash: string;
  /** Seaport order salt */
  salt: string;
  /** Seaport order conduit key */
  conduitKey: string;
  /** Sale proceed recipients */
  recipients: Array<Recipient>;
}

/** Seaport order extra data schema */
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

/** Seaport extra data schema */
export const EXTRA_DATA_SCHEMA = `
  tuple(
    tuple(uint256 orderIndex, uint256 itemIndex)[][] offerFulfillments,
    tuple(uint256 orderIndex, uint256 itemIndex)[][] considerationFulfillments
  )
`;
