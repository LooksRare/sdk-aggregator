import { BasicOrder, CollectionType, TradeData } from "../../types";
import * as LooksRareV1 from "../../interfaces/looksrare-v1";
import { BigNumber, constants, utils } from "ethers";
import { PROXY_EXECUTE_SELECTOR } from "../../constants/selectors";
import { MakerOrderFromAPI } from "../../interfaces/looksrare-v1";

const calculateEthValue = (orders: BasicOrder[]) => {
  return orders.reduce((sum: BigNumber, order: BasicOrder) => {
    return BigNumber.from(order.price).add(sum);
  }, constants.Zero);
};

export default function transformLooksRareV1Listings(
  listings: Array<MakerOrderFromAPI>,
  proxyAddress: string
): TradeData {
  const orders: BasicOrder[] = [];
  const ordersExtraData: LooksRareV1.OrderExtraData[] = [];

  listings.forEach((listing: MakerOrderFromAPI) => {
    const order: BasicOrder = {
      signer: listing.signer,
      collection: listing.collectionAddress,
      collectionType: CollectionType.ERC721,
      tokenIds: [listing.tokenId],
      amounts: [listing.amount.toString()],
      price: listing.price,
      currency: listing.currencyAddress,
      startTime: listing.startTime.toString(),
      endTime: listing.endTime.toString(),
      signature: listing.signature,
    };

    const orderExtraData: LooksRareV1.OrderExtraData = {
      makerAskPrice: listing.price,
      minPercentageToAsk: listing.minPercentageToAsk,
      nonce: listing.nonce,
      strategy: listing.strategy,
    };

    orders.push(order);
    ordersExtraData.push(orderExtraData);
  });

  const abiCoder = utils.defaultAbiCoder;

  const ordersExtraDataBytes: string[] = ordersExtraData.map((orderExtraData: LooksRareV1.OrderExtraData) =>
    abiCoder.encode(LooksRareV1.ORDER_EXTRA_DATA_SCHEMA, [
      orderExtraData.makerAskPrice,
      orderExtraData.minPercentageToAsk,
      orderExtraData.nonce,
      orderExtraData.strategy,
    ])
  );

  return {
    address: proxyAddress,
    selector: PROXY_EXECUTE_SELECTOR,
    value: calculateEthValue(orders),
    orders,
    ordersExtraData: ordersExtraDataBytes,
    extraData: constants.HashZero,
  };
}
