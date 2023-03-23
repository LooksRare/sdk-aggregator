import { expect } from "chai";
import { ethers } from "hardhat";
import { setUpContracts, Mocks, getSigners, getAddressOverrides } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { ContractMethods, SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";
import { constants } from "ethers";
import calculateTxFee from "./helpers/calculateTxFee";
import { Seaport } from "@opensea/seaport-js";
import { ItemType } from "@opensea/seaport-js/lib/constants";
import { setBalance } from "./helpers/setBalance";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  it("can execute Seaport orders (ERC721)", async () => {
    const chainId = SupportedChainId.MAINNET;
    const signers = await getSigners();
    const maker = signers.user1;
    const buyer = signers.buyer;
    const collection = contracts.collection1;
    const addresses: Addresses = getAddressOverrides(contracts);
    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const seaport = new Seaport(maker);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const { executeAllActions } = await seaport.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "69420",
        offer: [
          {
            itemType: ItemType.ERC721,
            token: collection.address,
            identifier: "1",
          },
        ],
        consideration: [
          {
            amount: ethers.constants.WeiPerEther.toString(),
            recipient: maker.address,
          },
        ],
      },
      maker.address
    );
    const order = await executeAllActions();
    const { tradeData } = await aggregator.transformListings({
      seaport: [order],
      looksRareV1: [],
      looksRareV2: [],
    });

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await setBalance(buyer.address, balanceBeforeTx);

    const contractMethods: ContractMethods = aggregator.execute(tradeData, buyer.address, true);

    const gasEstimate = await contractMethods.estimateGas();
    expect(gasEstimate.toNumber()).to.be.greaterThan(0);

    const tx = await contractMethods.call();

    expect(await collection.ownerOf(1)).to.equal(buyer.address);
    expect(await collection.balanceOf(buyer.address)).to.equal(1);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });

  it("can execute Seaport orders (ERC1155)", async () => {
    const chainId = SupportedChainId.MAINNET;
    const signers = await getSigners();
    const maker = signers.user3;
    const buyer = signers.buyer;
    const collection = contracts.collection3;
    const addresses: Addresses = getAddressOverrides(contracts);
    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const seaport = new Seaport(maker);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const { executeAllActions } = await seaport.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "69420",
        offer: [
          {
            itemType: ItemType.ERC1155,
            token: collection.address,
            identifier: "1",
            amount: "1",
          },
        ],
        consideration: [
          {
            amount: ethers.constants.WeiPerEther.toString(),
            recipient: maker.address,
          },
        ],
      },
      maker.address
    );
    const order = await executeAllActions();
    const { tradeData } = await aggregator.transformListings({
      seaport: [order],
      looksRareV1: [],
      looksRareV2: [],
    });

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await setBalance(buyer.address, balanceBeforeTx);

    const gasEstimate = await aggregator.execute(tradeData, buyer.address, true).estimateGas();
    expect(gasEstimate.toNumber()).to.be.greaterThan(0);

    const tx = await aggregator.execute(tradeData, buyer.address, true).call();

    expect(await collection.balanceOf(buyer.address, "1")).to.equal(1);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });
});
