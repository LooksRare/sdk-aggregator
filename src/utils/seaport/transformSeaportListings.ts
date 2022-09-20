import { BigNumber, constants, utils } from "ethers";
import { PROXY_EXECUTE_SELECTOR } from "../../constants/selectors";
import {
  Consideration,
  EXTRA_DATA_SCHEMA,
  FulfillmentComponent,
  ItemType,
  Offer,
  Order,
  OrderExtraData,
  ORDER_EXTRA_DATA_SCHEMA,
  Parameters,
  Recipient,
} from "../../interfaces/Seaport";
import { BasicOrder, CollectionType, TradeData } from "../../types";
import calculatePriceFromConsideration from "./calculatePriceFromConsideration";

const getCollectionType = (offer: Offer): CollectionType => {
  if (offer.itemType === ItemType.ERC721) {
    return CollectionType.ERC721;
  }

  if (offer.itemType === ItemType.ERC1155) {
    return CollectionType.ERC1155;
  }

  throw new Error(`Seaport item type ${ItemType[offer.itemType]} is not supported!`);
};

const getConsiderationRecipients = (consideration: Consideration[]): Array<Recipient> => {
  return consideration.map((considerationItem: Consideration) => ({
    amount: considerationItem.endAmount,
    recipient: considerationItem.recipient,
  }));
};

const calculateEthValue = (orders: BasicOrder[]): BigNumber => {
  return orders.reduce((sum: BigNumber, order: BasicOrder) => {
    if (order.currency === constants.AddressZero) {
      return BigNumber.from(order.price).add(sum);
    } else {
      return sum;
    }
  }, constants.Zero);
};

const validateConsiderationSameCurrency = (consideration: Consideration[]): void => {
  const isValid = consideration.every((considerationItem: Consideration) => {
    return considerationItem.token === consideration[0].token;
  });

  if (!isValid) {
    throw new Error("All consideration items must have the same currency!");
  }
};

export default function transformSeaportListings(listings: Order[], proxyAddress: string): TradeData {
  const orders: BasicOrder[] = [];
  const ordersExtraData: OrderExtraData[] = [];

  const offerFulfillments: Array<Array<FulfillmentComponent>> = [];
  const aggregatedConsideration: { [key: string]: FulfillmentComponent[] } = {};

  listings.forEach((listing: Order, orderIndex: number) => {
    const parameters: Parameters = listing.parameters;

    if (parameters.offer.length !== 1) {
      throw new Error("Only single offer item is supported!");
    }

    const offer: Offer = parameters.offer[0];
    const consideration: Consideration[] = parameters.consideration;

    validateConsiderationSameCurrency(consideration);

    const collectionType = getCollectionType(offer);

    const order: BasicOrder = {
      signer: parameters.offerer,
      collection: offer.token,
      collectionType,
      tokenIds: [offer.identifierOrCriteria],
      amounts: [offer.endAmount],
      price: calculatePriceFromConsideration(consideration),
      currency: consideration[0].token,
      startTime: parameters.startTime,
      endTime: parameters.endTime,
      signature: listing.signature,
    };

    const orderExtraData: OrderExtraData = {
      numerator: 1,
      denominator: offer.endAmount,
      orderType: parameters.orderType,
      zone: parameters.zone,
      zoneHash: parameters.zoneHash,
      salt: parameters.salt,
      conduitKey: parameters.conduitKey,
      recipients: getConsiderationRecipients(consideration),
    };

    orders.push(order);
    ordersExtraData.push(orderExtraData);

    offerFulfillments.push([{ orderIndex, itemIndex: 0 }]);

    consideration.forEach((considerationItem: Consideration, itemIndex: number) => {
      const recipient: string = considerationItem.recipient;
      if (!aggregatedConsideration[recipient]) {
        aggregatedConsideration[recipient] = [];
      }
      aggregatedConsideration[recipient].push({ orderIndex, itemIndex });
    });
  });

  const abiCoder = utils.defaultAbiCoder;

  const ordersExtraDataBytes: string[] = ordersExtraData.map((orderExtraData: OrderExtraData) =>
    abiCoder.encode([ORDER_EXTRA_DATA_SCHEMA], [orderExtraData])
  );

  const fulfillments = {
    offerFulfillments,
    considerationFulfillments: Object.values(aggregatedConsideration),
  };
  const extraData: string = abiCoder.encode([EXTRA_DATA_SCHEMA], [fulfillments]);

  return {
    address: proxyAddress,
    selector: PROXY_EXECUTE_SELECTOR,
    value: calculateEthValue(orders),
    orders,
    ordersExtraData: ordersExtraDataBytes,
    extraData,
  };
}
