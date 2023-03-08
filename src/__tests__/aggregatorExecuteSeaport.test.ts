import { expect } from "chai";
import { ethers } from "hardhat";
import { setUpContracts, Mocks, getSigners } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";
import { constants } from "ethers";
import calculateTxFee from "./helpers/calculateTxFee";
import { Seaport } from "@opensea/seaport-js";
import { ItemType } from "@opensea/seaport-js/lib/constants";

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
    const addresses: Addresses = {
      AGGREGATOR: contracts.looksRareAggregator.address,
      ERC20_ENABLED_AGGREGATOR: contracts.erc20EnabledLooksRareAggregator.address,
      LOOKSRARE_V1_PROXY: contracts.looksRareProxy.address,
      SEAPORT_PROXY: contracts.seaportProxy.address,
    };
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
    const { tradeData } = await aggregator.transformListings({ seaport: [order], looksRareV1: [] });

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await ethers.provider.send("hardhat_setBalance", [
      buyer.address,
      balanceBeforeTx.toHexString().replace("0x0", "0x"),
    ]);

    const gasEstimate = await aggregator.estimateGas(tradeData, buyer.address, true);
    expect(gasEstimate.toNumber()).to.be.closeTo(197_950, 10_000);

    const tx = await aggregator.execute(tradeData, buyer.address, true);

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
    const addresses: Addresses = {
      AGGREGATOR: contracts.looksRareAggregator.address,
      ERC20_ENABLED_AGGREGATOR: contracts.erc20EnabledLooksRareAggregator.address,
      LOOKSRARE_V1_PROXY: contracts.looksRareProxy.address,
      SEAPORT_PROXY: contracts.seaportProxy.address,
    };
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
    const { tradeData } = await aggregator.transformListings({ seaport: [order], looksRareV1: [] });

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await ethers.provider.send("hardhat_setBalance", [
      buyer.address,
      balanceBeforeTx.toHexString().replace("0x0", "0x"),
    ]);

    const gasEstimate = await aggregator.estimateGas(tradeData, buyer.address, true);
    expect(gasEstimate.toNumber()).to.be.closeTo(184_960, 500);

    const tx = await aggregator.execute(tradeData, buyer.address, true);

    expect(await collection.balanceOf(buyer.address, "1")).to.equal(1);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });
});
