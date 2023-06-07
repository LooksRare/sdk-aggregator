import { addressesByNetwork, Addresses } from "./constants/addresses";
import { BasicOrder, ContractMethods, Listings, TokenTransfer, TradeData, TransformListingsOutput } from "./types";
import transformSeaportListings from "./utils/Seaport/transformSeaportListings";
import transformLooksRareV2Listings from "./utils/LooksRareV2/transformLooksRareV2Listings";
import { BigNumber, constants, ContractTransaction, ethers, PayableOverrides, Signer } from "ethers";
import { executeETHOrders } from "./utils/calls/aggregator";
import { executeERC20Orders } from "./utils/calls/erc20EnabledAggregator";
import { Order } from "@opensea/seaport-js/lib/types";
import { approve, isAllowanceSufficient } from "./utils/calls/erc20";
import { calculateEthValue } from "./utils/calculateEthValue";
import { ChainId } from "@looksrare/sdk-v2";
import { MakerOrderFromAPI } from "./interfaces/LooksRareV2";

export class LooksRareAggregator {
  /**
   * The signer of transactions (NFT buyer)
   * @see https://docs.ethers.io/v5/api/signer/
   */
  public readonly signer: Signer;
  /** Current app chain ID */
  public readonly chainId: ChainId;
  /** Mapping of LooksRare aggregator addresses for the current chain */
  public readonly addresses: Addresses;

  /**
   * @constructor
   * @param signer The signer of transactions (NFT buyer)
   * @param chainId Current app chain ID
   * @param override Aggregator and proxy addresses override.
   *                 Only required if the SDK does not have
   *                 the contract addresses for the given chainId
   */
  constructor(signer: Signer, chainId: ChainId, override?: Addresses) {
    this.signer = signer;
    this.chainId = chainId;
    this.addresses = override ?? addressesByNetwork[this.chainId];
  }

  /**
   * @param tradeData An array of TradeData for the aggregator to process.
   *                  Each TradeData represents a batched order for a marketplace
   * @param recipient The recipient of the purchased NFTs
   * @param isAtomic Whether the transaction should revert if one of the trades fails
   * @param overrides Optional overrides for gas limit and other properties
   * @returns The executed contract transaction
   */
  public execute(
    tradeData: TradeData[],
    recipient: string,
    isAtomic: boolean,
    overrides?: PayableOverrides
  ): ContractMethods {
    const tokenTransfers: Array<TokenTransfer> = this.transactionTokenTransfers(tradeData);
    const value = this.transactionEthValue(tradeData);

    if (tokenTransfers.length > 0) {
      return executeERC20Orders(
        this.signer,
        this.addresses.ERC20_ENABLED_AGGREGATOR,
        tokenTransfers,
        tradeData,
        recipient,
        isAtomic,
        {
          ...overrides,
          value,
        }
      );
    } else {
      return executeETHOrders(this.signer, this.addresses.AGGREGATOR, tradeData, recipient, isAtomic, {
        ...overrides,
        value,
      });
    }
  }

  /**
   *
   * @param listings LooksRare and Seaport listings, directly fetched from the API
   * @returns Transformed listings that are ready to be consumed by the execute function.
   *          If the returned actions array is not empty, the contract transactions in the array
   *          (ERC20 approvals) have to be executed first before calling the execute function.
   */
  public async transformListings(listings: Listings): Promise<TransformListingsOutput> {
    let tradeData = [];
    if (listings.seaport_V1_4.length > 0) {
      tradeData.push(this.transformSeaportListings(listings.seaport_V1_4, this.addresses.SEAPORT_V1_4_PROXY));
    }
    if (listings.seaport_V1_5.length > 0) {
      tradeData.push(this.transformSeaportListings(listings.seaport_V1_5, this.addresses.SEAPORT_V1_5_PROXY));
    }
    if (listings.looksRareV2.length > 0) {
      tradeData = await this.transformLooksRareV2Listings(listings.looksRareV2);
    }

    const tokenTransfers: Array<TokenTransfer> = this.transactionTokenTransfers(tradeData);

    const buyer = await this.signer.getAddress();
    const areAllowancesSufficient = await Promise.all(
      tokenTransfers.map((tokenTransfer) =>
        isAllowanceSufficient(
          this.signer,
          tokenTransfer.currency,
          buyer,
          this.addresses.ERC20_ENABLED_AGGREGATOR,
          tokenTransfer.amount
        )
      )
    );

    const actions: Array<() => Promise<ContractTransaction>> = [];
    areAllowancesSufficient.forEach((sufficient, i) => {
      if (!sufficient) {
        actions.push(() => approve(this.signer, tokenTransfers[i].currency, this.addresses.ERC20_ENABLED_AGGREGATOR));
      }
    });

    return { tradeData, actions } as TransformListingsOutput;
  }

  public transactionEthValue(tradeData: TradeData[]): BigNumber {
    return tradeData.reduce(
      (sum: BigNumber, singleTradeData: TradeData) => calculateEthValue(singleTradeData).add(sum),
      constants.Zero
    );
  }

  /**
   * @notice The argument comes from Seaport listings API response's orders->protocol_data
   */
  private transformSeaportListings(listings: Order[], proxyAddress: string): TradeData {
    return transformSeaportListings(this.chainId, listings, proxyAddress);
  }

  private async transformLooksRareV2Listings(listings: MakerOrderFromAPI[]): Promise<Array<TradeData>> {
    //Split orders into different TradeData(Proxy call) if orders have different referrer addresses
    const groupedOrders = listings.reduce((result, order: MakerOrderFromAPI) => {
      const referrerAddress = order.referrer?.address || constants.AddressZero;
      if (!result[referrerAddress]) {
        result[referrerAddress] = [];
      }
      result[referrerAddress].push(order);
      return result;
    }, {} as Record<string, MakerOrderFromAPI[]>);

    return await Promise.all(
      Object.entries(groupedOrders).map(([referrer, orders]) =>
        transformLooksRareV2Listings(this.chainId, this.signer, referrer, orders, this.addresses.LOOKSRARE_V2_PROXY)
      )
    );
  }

  private transactionTokenTransfers(tradeData: TradeData[]): Array<TokenTransfer> {
    const tokenTransfersMapping: { [key: string]: BigNumber } = {};
    const tokenTransfers: Array<TokenTransfer> = [];

    tradeData.forEach((singleTradeData: TradeData) => {
      singleTradeData.orders.forEach((order: BasicOrder) => {
        const currency = order.currency;
        if (currency !== constants.AddressZero) {
          tokenTransfersMapping[currency] = tokenTransfersMapping[currency] ?? ethers.constants.Zero;
          tokenTransfersMapping[currency] = tokenTransfersMapping[currency].add(BigNumber.from(order.price));
        }
      });
    });

    Object.keys(tokenTransfersMapping).forEach((currency: string) => {
      tokenTransfers.push({ amount: tokenTransfersMapping[currency], currency });
    });

    return tokenTransfers;
  }
}
