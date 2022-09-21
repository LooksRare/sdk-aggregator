import { addressesByNetwork, Addresses } from "./constants/addresses";
import { MakerOrderFromAPI } from "./interfaces/LooksRareV1";
import * as Seaport from "./interfaces/Seaport";
import { Signer, SupportedChainId, TokenTransfer, TradeData } from "./types";
import transformSeaportListings from "./utils/Seaport/transformSeaportListings";
import transformLooksRareV1Listings from "./utils/LooksRareV1/transformLooksRareV1Listings";
import { BigNumber, constants, ContractTransaction } from "ethers";
import { execute } from "./utils/calls/aggregator";

export class LooksRareAggregator {
  public readonly signer: Signer;
  public readonly chainId: SupportedChainId;
  public readonly addresses: Addresses;

  constructor(signer: Signer, chainId: SupportedChainId, override?: Addresses) {
    this.signer = signer;
    this.chainId = chainId;
    this.addresses = override ?? addressesByNetwork[this.chainId];
  }

  public async execute(tradeData: TradeData[], recipient: string, isAtomic: boolean): Promise<ContractTransaction> {
    // TODO: We will worry about ERC-20 listings later.
    const tokenTransfers: Array<TokenTransfer> = [];
    const value = this.transactionEthValue(tradeData);
    const tx = await execute(this.signer, this.addresses.AGGREGATOR, tokenTransfers, tradeData, recipient, isAtomic, {
      value,
    });
    await tx.wait();
    return tx;
  }

  private transactionEthValue(tradeData: TradeData[]): BigNumber {
    return tradeData.reduce(
      (sum: BigNumber, singleTradeData: TradeData) => singleTradeData.value.add(sum),
      constants.Zero
    );
  }

  // The argument comes from Seaport listings API response's orders->protocol_data
  public transformSeaportListings(listings: Seaport.Order[]): TradeData {
    return transformSeaportListings(listings, this.addresses.SEAPORT_PROXY);
  }

  public transformLooksRareV1Listings(listings: MakerOrderFromAPI[]): TradeData {
    return transformLooksRareV1Listings(listings, this.addresses.LOOKSRARE_V1_PROXY);
  }
}
