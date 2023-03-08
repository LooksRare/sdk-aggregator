import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export const setBalance = async (address: string, balance: BigNumber) => {
  await ethers.provider.send("hardhat_setBalance", [address, balance.toHexString().replace("0x0", "0x")]);
};
