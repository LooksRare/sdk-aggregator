import { addressesByNetwork, Addresses } from "./constants/addresses";
import { SupportedChainId } from "./types";

export class LooksRareAggregator {
  public chainId: SupportedChainId;
  public addresses: Addresses;

  constructor(chainId: SupportedChainId, override?: Addresses) {
    this.chainId = chainId;
    this.addresses = override ?? addressesByNetwork[this.chainId];
  }
}
