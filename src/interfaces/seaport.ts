import { OrderType } from "@opensea/seaport-js/lib/constants";
import { BigNumberish } from "ethers";

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
