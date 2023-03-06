import { SupportedChainId } from "../types";

/** LooksRare aggregator contract addresses */
export interface Addresses {
  AGGREGATOR: string;
  ERC20_ENABLED_AGGREGATOR: string;
  LOOKSRARE_V1_PROXY: string;
  SEAPORT_PROXY: string;
}

const mainnetAddresses: Addresses = {
  AGGREGATOR: "0x00000000005228B791a99a61f36A130d50600106",
  ERC20_ENABLED_AGGREGATOR: "0x0000000000a35231D7706BD1eE827d43245655aB",
  LOOKSRARE_V1_PROXY: "0x0000000000DA151039Ed034d1C5BACb47C284Ed1",
  SEAPORT_PROXY: "0x0000000000aD2C5a35209EeAb701B2CD49BA3A0D",
};

const goerliAddresses: Addresses = {
  AGGREGATOR: "0x8190FfdC71F7cBE4c09793138c2434D344f01B2c",
  ERC20_ENABLED_AGGREGATOR: "0x733148c9b4a84C9ADff244D59b2A1dbdA5731472",
  LOOKSRARE_V1_PROXY: "0xCf4a864398e75eb5540FF0B8817b7343BfFe0548",
  SEAPORT_PROXY: "0x77A551F3be01E6e34499A47171FE31dE231053eA",
};

export const addressesByNetwork: { [chainId in SupportedChainId]: Addresses } = {
  [SupportedChainId.MAINNET]: mainnetAddresses,
  [SupportedChainId.GOERLI]: goerliAddresses,
  [SupportedChainId.HARDHAT]: goerliAddresses,
};
