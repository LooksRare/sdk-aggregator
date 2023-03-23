import { Contract, PayableOverrides, Signer } from "ethers";
import { ContractMethods, TokenTransfer, TradeData } from "../../types";
import abiERC20EnabledLooksRareAggregator from "../../abis/ERC20EnabledLooksRareAggregator.json";
import { ERC20EnabledLooksRareAggregator } from "../../typechain";

export const executeERC20Orders = (
  signer: Signer,
  address: string,
  tokenTransfers: Array<TokenTransfer>,
  tradeData: Array<TradeData>,
  recipient: string,
  isAtomic: boolean,
  overrides?: PayableOverrides
): ContractMethods => {
  const contract = new Contract(address, abiERC20EnabledLooksRareAggregator, signer) as ERC20EnabledLooksRareAggregator;

  return {
    call: (additionalOverrides?: PayableOverrides) =>
      contract.execute(tokenTransfers, tradeData, recipient, isAtomic, { ...overrides, ...additionalOverrides }),
    callStatic: (additionalOverrides?: PayableOverrides) =>
      contract.callStatic.execute(tokenTransfers, tradeData, recipient, isAtomic, {
        ...overrides,
        ...additionalOverrides,
      }),
    estimateGas: (additionalOverrides?: PayableOverrides) =>
      contract.estimateGas.execute(tokenTransfers, tradeData, recipient, isAtomic, {
        ...overrides,
        ...additionalOverrides,
      }),
    populateTransaction: (additionalOverrides?: PayableOverrides) =>
      contract.populateTransaction.execute(tokenTransfers, tradeData, recipient, isAtomic, {
        ...overrides,
        ...additionalOverrides,
      }),
  };
};
