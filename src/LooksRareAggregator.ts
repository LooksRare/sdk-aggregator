import { addressesByNetwork, Addresses } from "./constants/addresses";
import { MakerOrderFromAPI } from "./interfaces/looksrare-v1";
import * as Seaport from "./interfaces/seaport";
import { SupportedChainId, TradeData } from "./types";
import transformSeaportListings from "./utils/seaport/transformSeaportListings";
import transformLooksRareV1Listings from "./utils/looksrare-v1/transformLooksrareV1Listings";

export class LooksRareAggregator {
  public chainId: SupportedChainId;
  public addresses: Addresses;

  constructor(chainId: SupportedChainId, override?: Addresses) {
    this.chainId = chainId;
    this.addresses = override ?? addressesByNetwork[this.chainId];
  }

  // The argument comes from Seaport listings API response's orders->protocol_data
  public transformSeaportListings(listings: Seaport.Order[]): TradeData {
    return transformSeaportListings(listings, this.addresses.SEAPORT_PROXY);
  }

  public transformLooksRareV1Listings(listings: MakerOrderFromAPI[]): TradeData {
    return transformLooksRareV1Listings(listings, this.addresses.LOOKSRARE_V1_PROXY);
  }
}
