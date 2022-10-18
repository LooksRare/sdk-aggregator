import { Contract, PayableOverrides, Signer } from "ethers";
import { TokenTransfer, TradeData } from "../../types";
import abiERC20EnabledLooksRareAggregator from "../../abis/ERC20EnabledLooksRareAggregator.json";
import { ERC20EnabledLooksRareAggregator } from "../../../typechain";

export const executeERC20Orders = async (
  signer: Signer,
  address: string,
  tokenTransfers: Array<TokenTransfer>,
  tradeData: Array<TradeData>,
  recipient: string,
  isAtomic: boolean,
  overrides?: PayableOverrides
) => {
  const contract = new Contract(address, abiERC20EnabledLooksRareAggregator, signer) as ERC20EnabledLooksRareAggregator;
  return contract.execute(tokenTransfers, tradeData, recipient, isAtomic, { ...overrides });
};
