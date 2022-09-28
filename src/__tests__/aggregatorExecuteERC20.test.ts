import { expect } from "chai";
import { ethers } from "hardhat";
import { setUpContracts, Mocks, getSigners } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { SupportedChainId, TransformListingsOutput } from "../types";
import { Addresses } from "../constants/addresses";
import { Seaport } from "@opensea/seaport-js";
import { CROSS_CHAIN_SEAPORT_ADDRESS, ItemType } from "@opensea/seaport-js/lib/constants";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  it("can execute ERC-20 orders", async () => {
    const chainId = SupportedChainId.MAINNET;
    const signers = await getSigners();

    const buyer = signers.buyer;

    const { user1: maker1, user2: maker2, user3: maker3 } = signers;
    const { collection1, collection2, collection3 } = contracts;

    const seaport1 = new Seaport(maker1);
    const seaport2 = new Seaport(maker2);
    const seaport3 = new Seaport(maker3);

    const weth = contracts.weth;
    const usdc = contracts.usdc;

    const addresses: Addresses = {
      AGGREGATOR: contracts.looksRareAggregator.address,
      LOOKSRARE_V1_PROXY: contracts.looksRareProxy.address,
      SEAPORT_PROXY: contracts.seaportProxy.address,
    };

    await contracts.looksRareAggregator.approve(CROSS_CHAIN_SEAPORT_ADDRESS, weth.address);
    await contracts.looksRareAggregator.approve(CROSS_CHAIN_SEAPORT_ADDRESS, usdc.address);

    const originalWETHBalance = ethers.utils.parseEther("2");
    const originalUSDCBalance = ethers.utils.parseUnits("500", 6);

    await weth.mint(buyer.address, originalWETHBalance);
    await usdc.mint(buyer.address, originalUSDCBalance);

    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const order1Price = ethers.constants.WeiPerEther;
    const { executeAllActions: executeAllActions1 } = await seaport1.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "69420",
        offer: [{ itemType: ItemType.ERC721, token: collection1.address, identifier: "1" }],
        consideration: [
          { amount: order1Price.toString(), token: weth.address, identifier: "0", recipient: maker1.address },
        ],
      },
      maker1.address
    );
    const order1 = await executeAllActions1();

    const order2Price = ethers.utils.parseEther("0.5");
    const { executeAllActions: executeAllActions2 } = await seaport2.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "111",
        offer: [{ itemType: ItemType.ERC721, token: collection2.address, identifier: "2" }],
        consideration: [
          { amount: order2Price.toString(), token: weth.address, identifier: "0", recipient: maker2.address },
        ],
      },
      maker2.address
    );
    const order2 = await executeAllActions2();

    const order3Price = ethers.utils.parseUnits("125", 6);
    const { executeAllActions: executeAllActions3 } = await seaport3.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "85",
        offer: [{ itemType: ItemType.ERC1155, token: collection3.address, identifier: "3", amount: "1" }],
        consideration: [
          { amount: order3Price.toString(), token: usdc.address, identifier: "0", recipient: maker3.address },
        ],
      },
      maker3.address
    );
    const order3 = await executeAllActions3();

    const { tradeData, actions }: TransformListingsOutput = await aggregator.transformListings({
      seaport: [order1, order2, order3],
      looksRareV1: [],
    });

    await Promise.all(actions.map((action) => action()));

    await aggregator.execute(tradeData, buyer.address, true);

    expect(await collection1.ownerOf(1)).to.equal(buyer.address);
    expect(await collection1.balanceOf(buyer.address)).to.equal(1);

    expect(await collection2.ownerOf(2)).to.equal(buyer.address);
    expect(await collection2.balanceOf(buyer.address)).to.equal(1);

    expect(await collection3.balanceOf(buyer.address, 3)).to.equal(1);

    expect(await weth.balanceOf(buyer.address)).to.equal(originalWETHBalance.sub(order1Price).sub(order2Price));
    expect(await usdc.balanceOf(buyer.address)).to.equal(originalUSDCBalance.sub(order3Price));

    expect(await weth.balanceOf(maker1.address)).to.equal(order1Price);
    expect(await weth.balanceOf(maker2.address)).to.equal(order2Price);
    expect(await usdc.balanceOf(maker3.address)).to.equal(order3Price);
  });
});