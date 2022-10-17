import { Contract, PayableOverrides, Signer } from "ethers";
import { TokenTransfer, TradeData } from "../../types";
import abiLooksRareAggregator from "../../abis/LooksRareAggregator.json";
import { LooksRareAggregator } from "../../../typechain";

export const execute = async (
  signer: Signer,
  address: string,
  tokenTransfers: Array<TokenTransfer>,
  tradeData: Array<TradeData>,
  recipient: string,
  isAtomic: boolean,
  overrides?: PayableOverrides
) => {
  const contract = new Contract(address, abiLooksRareAggregator, signer) as LooksRareAggregator;

  const originator = signer.getAddress();

  return contract.execute(tokenTransfers, tradeData, originator, recipient, isAtomic, { ...overrides });
};
