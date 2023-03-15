import { BigNumber, constants, Contract, PayableOverrides, Signer } from "ethers";
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
  // NOTE: The aggregator contract sets originator as msg.sender no matter what, so we can save
  // a bit of gas by passing 0 bytes.
  const originator = constants.AddressZero;
  return contract.execute([], tradeData, originator, recipient, isAtomic, { ...overrides });
};

export const executeETHOrdersGasEstimate = async (
  signer: Signer,
  address: string,
  tradeData: Array<TradeData>,
  recipient: string,
  isAtomic: boolean,
  overrides?: PayableOverrides
): Promise<BigNumber> => {
  const contract = new Contract(address, abiLooksRareAggregator, signer) as LooksRareAggregator;
  // NOTE: The aggregator contract sets originator as msg.sender no matter what, so we can save
  // a bit of gas by passing 0 bytes.
  const originator = constants.AddressZero;
  return await contract.estimateGas.execute([], tradeData, originator, recipient, isAtomic, { ...overrides });
};
