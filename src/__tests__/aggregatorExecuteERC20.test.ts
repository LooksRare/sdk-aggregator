import { expect } from "chai";
import { ethers } from "hardhat";
import { setUpContracts, Mocks, getSigners } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { SupportedChainId } from "../types";
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

    await weth.mint(buyer.address, ethers.utils.parseEther("2"));
    await usdc.mint(buyer.address, ethers.utils.parseUnits("500", 6));

    await weth.connect(buyer).approve(addresses.AGGREGATOR, ethers.utils.parseEther("1.5"));
    await usdc.connect(buyer).approve(addresses.AGGREGATOR, ethers.utils.parseUnits("125", 6));

    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const { executeAllActions: executeAllActions1 } = await seaport1.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "69420",
        offer: [
          {
            itemType: ItemType.ERC721,
            token: collection1.address,
            identifier: "1",
          },
        ],
        consideration: [
          {
            amount: ethers.constants.WeiPerEther.toString(),
            token: weth.address,
            identifier: "0",
            recipient: maker1.address,
          },
        ],
      },
      maker1.address
    );
    const order1 = await executeAllActions1();

    const { executeAllActions: executeAllActions2 } = await seaport2.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "111",
        offer: [
          {
            itemType: ItemType.ERC721,
            token: collection2.address,
            identifier: "2",
          },
        ],
        consideration: [
          {
            amount: ethers.utils.parseEther("0.5").toString(),
            token: weth.address,
            identifier: "0",
            recipient: maker2.address,
          },
        ],
      },
      maker2.address
    );
    const order2 = await executeAllActions2();

    const { executeAllActions: executeAllActions3 } = await seaport3.createOrder(
      {
        startTime: now.toString(),
        endTime: (now + 86400).toString(),
        salt: "85",
        offer: [
          {
            itemType: ItemType.ERC1155,
            token: collection3.address,
            identifier: "3",
            amount: "1",
          },
        ],
        consideration: [
          {
            amount: ethers.utils.parseUnits("125", 6).toString(),
            token: usdc.address,
            identifier: "0",
            recipient: maker3.address,
          },
        ],
      },
      maker3.address
    );
    const order3 = await executeAllActions3();

    const tradeData = aggregator.transformSeaportListings([order1, order2, order3]);

    await aggregator.execute([tradeData], buyer.address, true);

    expect(await collection1.ownerOf(1)).to.equal(buyer.address);
    expect(await collection1.balanceOf(buyer.address)).to.equal(1);

    expect(await collection2.ownerOf(2)).to.equal(buyer.address);
    expect(await collection2.balanceOf(buyer.address)).to.equal(1);

    expect(await collection3.balanceOf(buyer.address, 3)).to.equal(1);

    expect(await weth.balanceOf(buyer.address)).to.equal(ethers.utils.parseEther("0.5"));
    expect(await usdc.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("375", 6));

    expect(await weth.balanceOf(maker1.address)).to.equal(ethers.constants.WeiPerEther);
    expect(await weth.balanceOf(maker2.address)).to.equal(ethers.utils.parseEther("0.5"));
    expect(await usdc.balanceOf(maker3.address)).to.equal(ethers.utils.parseUnits("125", 6));
  });
});