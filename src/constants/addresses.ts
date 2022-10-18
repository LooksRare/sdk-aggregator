import { SupportedChainId } from "../types";

/** LooksRare aggregator contract addresses */
export interface Addresses {
  AGGREGATOR: string;
  ERC20_ENABLED_AGGREGATOR: string;
  LOOKSRARE_V1_PROXY: string;
  SEAPORT_PROXY: string;
}

const mainnetAddresses: Addresses = {
  AGGREGATOR: "",
  ERC20_ENABLED_AGGREGATOR: "",
  LOOKSRARE_V1_PROXY: "",
  SEAPORT_PROXY: "",
};

const goerliAddresses: Addresses = {
  AGGREGATOR: "",
  ERC20_ENABLED_AGGREGATOR: "",
  LOOKSRARE_V1_PROXY: "",
  SEAPORT_PROXY: "",
};

export const addressesByNetwork: { [chainId in SupportedChainId]: Addresses } = {
  [SupportedChainId.MAINNET]: mainnetAddresses,
  [SupportedChainId.GOERLI]: goerliAddresses,
  [SupportedChainId.HARDHAT]: goerliAddresses,
};
