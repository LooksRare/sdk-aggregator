import { addressesByNetwork, Addresses } from "./constants/addresses";
import { MakerOrderFromAPI } from "./interfaces/LooksRareV1";
import { BasicOrder, Listings, SupportedChainId, TokenTransfer, TradeData, TransformListingsOutput } from "./types";
import transformSeaportListings from "./utils/Seaport/transformSeaportListings";
import transformLooksRareV1Listings from "./utils/LooksRareV1/transformLooksRareV1Listings";
import { BigNumber, constants, ContractTransaction, Signer } from "ethers";
import { execute } from "./utils/calls/aggregator";
import { Order } from "@opensea/seaport-js/lib/types";
import { ethers } from "hardhat";
import { approve, isAllowanceSufficient } from "./utils/calls/erc20";

export class LooksRareAggregator {
  /**
   * The signer of transactions (NFT buyer)
   * @see https://docs.ethers.io/v5/api/signer/
   */
  public readonly signer: Signer;
  /** Current app chain ID */
  public readonly chainId: SupportedChainId;
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
  constructor(signer: Signer, chainId: SupportedChainId, override?: Addresses) {
    this.signer = signer;
    this.chainId = chainId;
    this.addresses = override ?? addressesByNetwork[this.chainId];
  }

  /**
   * @param tradeData An array of TradeData for the aggregator to process.
   *                  Each TradeData represents a batched order for a marketplace
   * @param recipient The recipient of the purchased NFTs
   * @param isAtomic Whether the transaction should revert if one of the trades fails
   * @returns The executed contract transaction
   */
  public async execute(tradeData: TradeData[], recipient: string, isAtomic: boolean): Promise<ContractTransaction> {
    const tokenTransfers: Array<TokenTransfer> = this.transactionTokenTransfers(tradeData);
    const value = this.transactionEthValue(tradeData);
    const tx = await execute(this.signer, this.addresses.AGGREGATOR, tokenTransfers, tradeData, recipient, isAtomic, {
      value,
    });
    await tx.wait();
    return tx;
  }

  /**
   *
   * @param listings LooksRare and Seaport listings, directly fetched from the API
   * @returns Transformed listings that are ready to be consumed by the execute function.
   *          If the returned actions array is not empty, the contract transactions in the array
   *          (ERC20 approvals) have to be executed first before calling the execute function.
   */
  public async transformListings(listings: Listings): Promise<TransformListingsOutput> {
    const tradeData = [];
    if (listings.seaport.length > 0) {
      tradeData.push(this.transformSeaportListings(listings.seaport));
    }
    if (listings.looksRareV1.length > 0) {
      const looksRareV1Listings = await this.transformLooksRareV1Listings(listings.looksRareV1);
      tradeData.push(looksRareV1Listings);
    }

    const tokenTransfers: Array<TokenTransfer> = this.transactionTokenTransfers(tradeData);

    const buyer = await this.signer.getAddress();
    const areAllowancesSufficient = await Promise.all(
      tokenTransfers.map((tokenTransfer) =>
        isAllowanceSufficient(
          ethers.provider,
          tokenTransfer.currency,
          buyer,
          this.addresses.AGGREGATOR,
          tokenTransfer.amount
        )
      )
    );

    const actions: Array<() => Promise<ContractTransaction>> = [];
    areAllowancesSufficient.forEach((sufficient, i) => {
      if (!sufficient) {
        actions.push(() => approve(this.signer, tokenTransfers[i].currency, this.addresses.AGGREGATOR));
      }
    });

    return { tradeData, actions } as TransformListingsOutput;
  }

  /**
   * @notice The argument comes from Seaport listings API response's orders->protocol_data
   */
  public transformSeaportListings(listings: Order[]): TradeData {
    return transformSeaportListings(listings, this.addresses.SEAPORT_PROXY);
  }

  public async transformLooksRareV1Listings(listings: MakerOrderFromAPI[]): Promise<TradeData> {
    return await transformLooksRareV1Listings(this.signer.provider!, listings, this.addresses.LOOKSRARE_V1_PROXY);
  }

  private transactionEthValue(tradeData: TradeData[]): BigNumber {
    return tradeData.reduce(
      (sum: BigNumber, singleTradeData: TradeData) => singleTradeData.value.add(sum),
      constants.Zero
    );
  }

  private transactionTokenTransfers(tradeData: TradeData[]): Array<TokenTransfer> {
    const tokenTransfersMapping: { [key: string]: BigNumber } = {};
    const tokenTransfers: Array<TokenTransfer> = [];

    tradeData.forEach((singleTradeData: TradeData) => {
      singleTradeData.orders.forEach((order: BasicOrder) => {
        const currency = order.currency;
        // NOTE: If LooksRare V1 + currency == WETH, skip. We are going to pay in ETH.
        if (currency !== constants.AddressZero && singleTradeData.proxy !== this.addresses.LOOKSRARE_V1_PROXY) {
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
