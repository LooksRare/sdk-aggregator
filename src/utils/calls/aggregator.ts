import { Contract, PayableOverrides, Signer } from "ethers";
import { TradeData } from "../../types";
import abiLooksRareAggregator from "../../abis/LooksRareAggregator.json";
import { LooksRareAggregator } from "../../../typechain";

export const executeETHOrders = async (
  signer: Signer,
  address: string,
  tradeData: Array<TradeData>,
  recipient: string,
  isAtomic: boolean,
  overrides?: PayableOverrides
) => {
  const contract = new Contract(address, abiLooksRareAggregator, signer) as LooksRareAggregator;

  // NOTE: Maybe make it 0 address to save gas, since the contract will set it to msg.sender anyway.
  const originator = await signer.getAddress();

  return contract.execute([], tradeData, originator, recipient, isAtomic, { ...overrides });
};
