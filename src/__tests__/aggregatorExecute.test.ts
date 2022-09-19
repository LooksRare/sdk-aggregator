import { expect } from "chai";
import { ethers } from "hardhat";
import { setUpContracts, Mocks, getSigners, LOOKSRARE_TRANSFER_MANAGER } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";
import { addressesByNetwork, MakerOrder, generateMakerOrderTypedData } from "@looksrare/sdk";
import { constants } from "ethers";
import { MakerOrderFromAPI } from "../interfaces/LooksRareV1";
import calculateTxFee from "./helpers/calculateTxFee";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  it("can execute LooksRare V1 orders", async () => {
    const chainId = SupportedChainId.MAINNET;
    const signers = await getSigners();
    const maker = signers.user1;
    const buyer = signers.buyer;
    const collection = contracts.collection1;
    const addresses: Addresses = {
      AGGREGATOR: contracts.looksRareAggregator.address,
      LOOKSRARE_V1_PROXY: contracts.looksRareProxy.address,
      SEAPORT_PROXY: contracts.seaportProxy.address,
    };
    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const makerOrder: MakerOrder = {
      isOrderAsk: true,
      signer: maker.address,
      collection: collection.address,
      price: constants.WeiPerEther, // 1 ETH
      tokenId: "1",
      amount: "1",
      strategy: addressesByNetwork[chainId].STRATEGY_STANDARD_SALE,
      currency: addressesByNetwork[chainId].WETH,
      nonce: 0,
      startTime: now,
      endTime: now + 86400, // 1 day validity
      minPercentageToAsk: 9550,
      params: [],
    };
    const { domain, value, type } = generateMakerOrderTypedData(maker.address, chainId, makerOrder);
    const signature = await maker._signTypedData(domain, type, value);

    // Fake an order from the API
    const makerOrderFromAPI: MakerOrderFromAPI = {
      currencyAddress: makerOrder.currency,
      collectionAddress: collection.address,
      signature,
      ...makerOrder,
    };

    const tradeData = aggregator.transformLooksRareV1Listings([makerOrderFromAPI]);

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await ethers.provider.send("hardhat_setBalance", [
      buyer.address,
      balanceBeforeTx.toHexString().replace("0x0", "0x"),
    ]);

    await collection.connect(maker).setApprovalForAll(LOOKSRARE_TRANSFER_MANAGER, true);

    const tx = await aggregator.execute([tradeData], buyer.address, true);

    expect(await collection.ownerOf(1)).to.equal(buyer.address);
    expect(await collection.balanceOf(buyer.address)).to.equal(1);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });
});
