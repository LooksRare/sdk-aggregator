import { constants, Contract, PayableOverrides, Signer } from "ethers";
import { ContractMethods, TradeData } from "../../types";
import abiLooksRareAggregator from "../../abis/LooksRareAggregator.json";
import { LooksRareAggregator } from "../../typechain";

export const executeETHOrders = (
  signer: Signer,
  address: string,
  tradeData: Array<TradeData>,
  recipient: string,
  isAtomic: boolean,
  overrides?: PayableOverrides
): ContractMethods => {
  const contract = new Contract(address, abiLooksRareAggregator, signer) as LooksRareAggregator;
  // NOTE: The aggregator contract sets originator as msg.sender no matter what, so we can save
  // a bit of gas by passing 0 bytes.
  const originator = constants.AddressZero;

  return {
    call: (additionalOverrides?: PayableOverrides) =>
      contract.execute([], tradeData, originator, recipient, isAtomic, { ...overrides, ...additionalOverrides }),
    callStatic: (additionalOverrides?: PayableOverrides) =>
      contract.callStatic.execute([], tradeData, originator, recipient, isAtomic, {
        ...overrides,
        ...additionalOverrides,
      }),
    estimateGas: (additionalOverrides?: PayableOverrides) =>
      contract.estimateGas.execute([], tradeData, originator, recipient, isAtomic, {
        ...overrides,
        ...additionalOverrides,
      }),
    populateTransaction: (additionalOverrides?: PayableOverrides) =>
      contract.populateTransaction.execute([], tradeData, originator, recipient, isAtomic, {
        ...overrides,
        ...additionalOverrides,
      }),
  };
};
