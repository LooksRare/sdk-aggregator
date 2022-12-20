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
  AGGREGATOR: "0x8190FfdC71F7cBE4c09793138c2434D344f01B2c",
  ERC20_ENABLED_AGGREGATOR: "0x733148c9b4a84C9ADff244D59b2A1dbdA5731472",
  LOOKSRARE_V1_PROXY: "0xCf4a864398e75eb5540FF0B8817b7343BfFe0548",
  SEAPORT_PROXY: "0x21b039a9E97c39DCB8cc01979eC3b91686f19e8f",
};

export const addressesByNetwork: { [chainId in SupportedChainId]: Addresses } = {
  [SupportedChainId.MAINNET]: mainnetAddresses,
  [SupportedChainId.GOERLI]: goerliAddresses,
  [SupportedChainId.HARDHAT]: goerliAddresses,
};
