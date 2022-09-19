import { BigNumber, constants, utils } from "ethers";
import { PROXY_EXECUTE_SELECTOR } from "../../constants/selectors";
import { BasicOrder, CollectionType, TradeData } from "../../types";
import calculatePriceFromConsideration from "./calculatePriceFromConsideration";
import * as Seaport from "../../interfaces/seaport";

const getCollectionType = (offer: Seaport.Offer): CollectionType => {
  if (offer.itemType === Seaport.ItemType.ERC721) {
    return CollectionType.ERC721;
  } else if (offer.itemType === Seaport.ItemType.ERC1155) {
    return CollectionType.ERC1155;
  } else {
    throw new Error(`Seaport item type ${Seaport.ItemType[offer.itemType]} is not supported!`);
  }
};

const getConsiderationRecipients = (consideration: Seaport.Consideration[]): Array<Seaport.Recipient> => {
  return consideration.map((considerationItem: Seaport.Consideration) => ({
    amount: considerationItem.endAmount,
    recipient: considerationItem.recipient,
  }));
};

const calculateEthValue = (orders: BasicOrder[]) => {
  return orders.reduce((sum: BigNumber, order: BasicOrder) => {
    if (order.currency === constants.AddressZero) {
      return BigNumber.from(order.price).add(sum);
    } else {
      return sum;
    }
  }, constants.Zero);
};

const validateConsiderationSameCurrency = (consideration: Seaport.Consideration[]): void => {
  const isValid = consideration.every((considerationItem: Seaport.Consideration) => {
    return considerationItem.token === consideration[0].token;
  });

  if (!isValid) {
    throw new Error("All consideration items must have the same currency!");
  }
};

export default function transformSeaportListings(listings: Seaport.Order[], proxyAddress: string): TradeData {
  const orders: BasicOrder[] = [];
  const ordersExtraData: Seaport.OrderExtraData[] = [];

  const offerFulfillments: Array<Array<Seaport.FulfillmentComponent>> = [];
  const aggregatedConsideration: { [key: string]: Seaport.FulfillmentComponent[] } = {};

  listings.forEach((listing: Seaport.Order, orderIndex: number) => {
    const parameters: Seaport.Parameters = listing.parameters;

    if (parameters.offer.length !== 1) {
      throw new Error("Only single offer item is supported!");
    }

    const offer: Seaport.Offer = parameters.offer[0];
    const consideration: Seaport.Consideration[] = parameters.consideration;

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

    const orderExtraData: Seaport.OrderExtraData = {
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

    consideration.forEach((considerationItem: Seaport.Consideration, itemIndex: number) => {
      const recipient: string = considerationItem.recipient;
      if (!aggregatedConsideration[recipient]) {
        aggregatedConsideration[recipient] = [];
      }
      aggregatedConsideration[recipient].push({ orderIndex, itemIndex });
    });
  });

  const abiCoder = utils.defaultAbiCoder;

  const ordersExtraDataBytes: string[] = ordersExtraData.map((orderExtraData: Seaport.OrderExtraData) =>
    abiCoder.encode([Seaport.ORDER_EXTRA_DATA_SCHEMA], [orderExtraData])
  );

  const fulfillments = {
    offerFulfillments,
    considerationFulfillments: Object.values(aggregatedConsideration),
  };
  const extraData: string = abiCoder.encode([Seaport.EXTRA_DATA_SCHEMA], [fulfillments]);

  return {
    address: proxyAddress,
    selector: PROXY_EXECUTE_SELECTOR,
    value: calculateEthValue(orders),
    orders,
    ordersExtraData: ordersExtraDataBytes,
    extraData,
  };
}
