import { BasicOrder, CollectionType, SupportedChainId, TradeData } from "../../types";
import { constants, Contract, ethers, utils } from "ethers";
import { PROXY_EXECUTE_SELECTOR } from "../../constants/selectors";
import { MakerOrderFromAPI, OrderExtraData, ORDER_EXTRA_DATA_SCHEMA } from "../../interfaces/LooksRareV1";
import abiIERC165 from "@looksrare/contracts-libs/abis/IERC165.json";
import { INTERFACE_ID_ERC_1155, INTERFACE_ID_ERC_721 } from "../../constants/interfaceIds";

export default async function transformLooksRareV1Listings(
  chainId: SupportedChainId,
  signer: ethers.Signer,
  listings: Array<MakerOrderFromAPI>,
  proxy: string
): Promise<TradeData> {
  const orders: BasicOrder[] = [];
  const ordersExtraData: OrderExtraData[] = [];

  await Promise.all(
    listings.map(async (listing: MakerOrderFromAPI): Promise<void> => {
      const collection = listing.collectionAddress;

      const token = new Contract(collection, abiIERC165, signer);
      let collectionType;
      // eslint-disable-next-line no-await-in-loop
      const supportsERC1155 = await token.supportsInterface(INTERFACE_ID_ERC_1155);
      if (supportsERC1155) {
        collectionType = CollectionType.ERC1155;
      } else {
        // eslint-disable-next-line no-await-in-loop
        const supportsERC721 = await token.supportsInterface(INTERFACE_ID_ERC_721);
        if (supportsERC721) {
          collectionType = CollectionType.ERC721;
        } else {
          throw new Error("Collection is neither ERC-1155 nor ERC-721!");
        }
      }

      const order: BasicOrder = {
        signer: listing.signer,
        collection,
        collectionType,
        tokenIds: [listing.tokenId],
        amounts: [listing.amount.toString()],
        price: listing.price,
        currency: listing.currencyAddress,
        startTime: listing.startTime.toString(),
        endTime: listing.endTime.toString(),
        signature: listing.signature,
      };

      const orderExtraData: OrderExtraData = {
        makerAskPrice: listing.price,
        minPercentageToAsk: listing.minPercentageToAsk,
        nonce: listing.nonce,
        strategy: listing.strategy,
      };

      orders.push(order);
      ordersExtraData.push(orderExtraData);
    })
  );

  const abiCoder = utils.defaultAbiCoder;

  const ordersExtraDataBytes: string[] = ordersExtraData.map((orderExtraData: OrderExtraData) =>
    abiCoder.encode(ORDER_EXTRA_DATA_SCHEMA, [
      orderExtraData.makerAskPrice,
      orderExtraData.minPercentageToAsk,
      orderExtraData.nonce,
      orderExtraData.strategy,
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
