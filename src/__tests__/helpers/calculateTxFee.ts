import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { TransactionResponse } from "@ethersproject/abstract-provider";

export default async function calculateTxFee(tx: TransactionResponse): Promise<BigNumber> {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  const gasUsed = receipt.gasUsed;
  return gasUsed.mul(tx.gasPrice as BigNumber);
}
