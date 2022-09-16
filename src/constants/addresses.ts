import { SupportedChainId } from "../types";

export interface Addresses {
  AGGREGATOR: string;
}

const mainnetAddresses: Addresses = {
  AGGREGATOR: "",
};

const goerliAddresses: Addresses = {
  AGGREGATOR: "",
};

export const addressesByNetwork: { [chainId in SupportedChainId]: Addresses } = {
  [SupportedChainId.MAINNET]: mainnetAddresses,
  [SupportedChainId.GOERLI]: goerliAddresses,
  [SupportedChainId.HARDHAT]: goerliAddresses,
};
