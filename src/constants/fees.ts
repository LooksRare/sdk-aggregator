import { BigNumber, ethers } from "ethers";
import { SupportedChainId } from "../types";

export interface Fees {
  LOOKSRARE_V1_PROXY: BigNumber;
  SEAPORT_PROXY: BigNumber;
}

const mainnetFees: Fees = {
  LOOKSRARE_V1_PROXY: ethers.constants.Zero,
  SEAPORT_PROXY: ethers.constants.Zero,
};

const goerliFees: Fees = {
  LOOKSRARE_V1_PROXY: ethers.constants.Zero,
  SEAPORT_PROXY: ethers.constants.Zero,
};

export const feesByNetwork: { [chainId in SupportedChainId]: Fees } = {
  [SupportedChainId.MAINNET]: mainnetFees,
  [SupportedChainId.GOERLI]: goerliFees,
  [SupportedChainId.HARDHAT]: goerliFees,
};
