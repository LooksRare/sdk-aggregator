import { SupportedChainId } from "../types";

export interface Addresses {
  AGGREGATOR: string;
  LOOKSRARE_V1_PROXY: string;
  SEAPORT_PROXY: string;
}

const mainnetAddresses: Addresses = {
  AGGREGATOR: "",
  LOOKSRARE_V1_PROXY: "",
  SEAPORT_PROXY: "",
};

const goerliAddresses: Addresses = {
  AGGREGATOR: "",
  LOOKSRARE_V1_PROXY: "",
  SEAPORT_PROXY: "",
};

export const addressesByNetwork: { [chainId in SupportedChainId]: Addresses } = {
  [SupportedChainId.MAINNET]: mainnetAddresses,
  [SupportedChainId.GOERLI]: goerliAddresses,
  [SupportedChainId.HARDHAT]: goerliAddresses,
};
