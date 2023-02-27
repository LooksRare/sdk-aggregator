import { BasicOrder, SupportedChainId, TradeData } from "../../types";
import { constants, ethers, utils } from "ethers";
import { PROXY_EXECUTE_SELECTOR } from "../../constants/selectors";
import { MakerOrderFromAPI, MerkleTree, OrderExtraData, ORDER_EXTRA_DATA_SCHEMA, QuoteType } from "../../interfaces/LooksRareV2";

export default async function transformLooksRareV2Listings(
  chainId: SupportedChainId,
  signer: ethers.Signer,
  listings: Array<MakerOrderFromAPI>,
  proxy: string
): Promise<TradeData> {
  const orders: BasicOrder[] = [];
  const ordersExtraData: OrderExtraData[] = [];
  // TODO: How do we retrieve the actual merkle tree?
  const merkleTree: MerkleTree = {
    root: constants.HashZero,
    proof: [],
  };

  await Promise.all(
    listings.map(async (listing: MakerOrderFromAPI): Promise<void> => {
      if (listing.quoteType !== QuoteType.Ask) {
        throw new Error("Only orders with quoteType 'ask' are supported!");
      }

      const order: BasicOrder = {
        signer: listing.signer,
        collection: listing.collection,
        collectionType: listing.collectionType,
        tokenIds: listing.itemIds,
        amounts: listing.amounts.map((amount) => amount.toString()),
        price: listing.price,
        currency: listing.currency,
        startTime: listing.startTime.toString(),
        endTime: listing.endTime.toString(),
        signature: listing.signature,
      };

      const orderExtraData: OrderExtraData = {
        merkleTree,
        globalNonce: listing.globalNonce,
        subsetNonce: listing.subsetNonce,
        orderNonce: listing.orderNonce,
        strategyId: listing.strategy,
        price: listing.price,
        takerBidAdditionalParameters: constants.HashZero,
        makerAskAdditionalParameters: listing.additionalParameters,
      };

      orders.push(order);
      ordersExtraData.push(orderExtraData);
    })
  );

  const abiCoder = utils.defaultAbiCoder;

  const ordersExtraDataBytes: string[] = ordersExtraData.map((orderExtraData: OrderExtraData) =>
    abiCoder.encode(ORDER_EXTRA_DATA_SCHEMA, [
      orderExtraData.merkleTree,
      orderExtraData.globalNonce,
      orderExtraData.subsetNonce,
      orderExtraData.orderNonce,
      orderExtraData.strategyId,
      orderExtraData.price,
      orderExtraData.takerBidAdditionalParameters,
      orderExtraData.makerAskAdditionalParameters,
    ])
  );

  return {
    proxy,
    selector: PROXY_EXECUTE_SELECTOR,
    orders,
    ordersExtraData: ordersExtraDataBytes,
    extraData: constants.HashZero,
  };
}
