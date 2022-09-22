import { BigNumberish, Contract, ethers, Overrides, Signer } from "ethers";
import abiIERC20 from "../../abis/IERC20.json";
import { IERC20 } from "../../../typechain";

const allowance = (
  signerOrProvider: ethers.providers.Provider | Signer,
  currency: string,
  account: string,
  operator: string,
  overrides?: Overrides
) => {
  const contract = new Contract(currency, abiIERC20, signerOrProvider) as IERC20;
  return contract.allowance(account, operator, { ...overrides });
};

export const isAllowanceSufficient = async (
  signerOrProvider: ethers.providers.Provider | Signer,
  currency: string,
  account: string,
  operator: string,
  amount: BigNumberish,
  overrides?: Overrides
) => {
  const operatorAllowance = await allowance(signerOrProvider, currency, account, operator, overrides);
  return operatorAllowance.gt(amount);
};

export const approve = (signer: Signer, currency: string, operator: string, overrides?: Overrides) => {
  const contract = new Contract(currency, abiIERC20, signer) as IERC20;
  return contract.approve(operator, ethers.constants.MaxUint256, { ...overrides });
};
