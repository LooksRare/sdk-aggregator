import { MerkleTree, Maker } from "@looksrare/sdk-v2";
import { BigNumberish, BytesLike } from "ethers";

export interface Referrer {
  address: string;
  rate: BigNumberish;
}

export interface MakerOrderFromAPI extends Maker {
  signature: string;
  merkleTree: MerkleTree;
  referrer: Referrer;
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
