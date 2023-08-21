import { ChainId } from "@looksrare/sdk-v2";
import { Addresses } from "../types";

const mainnetAddresses: Addresses = {
  AGGREGATOR: "0x00000000005228B791a99a61f36A130d50600106",
  ERC20_ENABLED_AGGREGATOR: "0x0000000000a35231D7706BD1eE827d43245655aB",
  LOOKSRARE_V2_PROXY: "0x000000000074f2e99d7602fCA3cf0ffdCa906495",
  SEAPORT_V1_4_PROXY: "0x0000000000aD2C5a35209EeAb701B2CD49BA3A0D",
  SEAPORT_V1_5_PROXY: "0x000000000055d65008F1dFf7167f24E70DB431F6",
};

const goerliAddresses: Addresses = {
  AGGREGATOR: "0x00000000005228B791a99a61f36A130d50600106",
  ERC20_ENABLED_AGGREGATOR: "0x0000000000a35231D7706BD1eE827d43245655aB",
  LOOKSRARE_V2_PROXY: "0x5AAf7A47A96f4695b4c5F4d4706C04ae606FA59f",
  SEAPORT_V1_4_PROXY: "0x0000000000aD2C5a35209EeAb701B2CD49BA3A0D",
  SEAPORT_V1_5_PROXY: "0x000000000055d65008F1dFf7167f24E70DB431F6",
};

const sepoliaAddresses: Addresses = {
  AGGREGATOR: "0x00000000005228B791a99a61f36A130d50600106",
  ERC20_ENABLED_AGGREGATOR: "0x0000000000a35231D7706BD1eE827d43245655aB",
  LOOKSRARE_V2_PROXY: "0xbe1A28000cfE2009051ac6F5b865BC03a04be875",
  SEAPORT_V1_4_PROXY: "",
  SEAPORT_V1_5_PROXY: "0x000000000055d65008F1dFf7167f24E70DB431F6",
};

export const addressesByNetwork: { [chainId in ChainId]: Addresses } = {
  [ChainId.MAINNET]: mainnetAddresses,
  [ChainId.GOERLI]: goerliAddresses,
  [ChainId.SEPOLIA]: sepoliaAddresses,
  [ChainId.HARDHAT]: goerliAddresses,
};
