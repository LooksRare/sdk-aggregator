import { PayableOverrides } from "ethers";
import { ethers } from "hardhat";
import { TokenTransfer, TradeData, Signer } from "../../types";

export const execute = async (
  signer: Signer,
  address: string,
  tokenTransfers: Array<TokenTransfer>,
  tradeData: Array<TradeData>,
  recipient: string,
  isAtomic: boolean,
  overrides?: PayableOverrides
) => {
  const contract = await ethers.getContractAt("LooksRareAggregator", address);
  return contract.connect(signer).execute(tokenTransfers, tradeData, recipient, isAtomic, {
    ...overrides,
  });
};