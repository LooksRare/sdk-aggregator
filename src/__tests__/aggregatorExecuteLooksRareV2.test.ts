import { expect } from "chai";
import { ethers } from "hardhat";
import calculateTxFee from "./helpers/calculateTxFee";
import { setUpContracts, Mocks, getSigners } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { CollectionType, SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";
import { constants, Contract, ContractTransaction } from "ethers";
import { MakerOrderFromAPI, QuoteType } from "../interfaces/LooksRareV2";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { LooksRare, utils, Maker } from "@looksrare/sdk-v2";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  const executeLooksRareV2Order = async (
    maker: SignerWithAddress,
    collection: Contract,
    collectionType: CollectionType,
    currency: string,
    itemIds: [string],
    amounts: [string]
  ): Promise<ContractTransaction> => {
    const chainId = SupportedChainId.MAINNET;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const addresses: Addresses = {
      AGGREGATOR: contracts.looksRareAggregator.address,
      ERC20_ENABLED_AGGREGATOR: contracts.erc20EnabledLooksRareAggregator.address,
      LOOKSRARE_V1_PROXY: contracts.looksRareProxy.address,
      LOOKSRARE_V2_PROXY: contracts.looksRareV2Proxy.address,
      SEAPORT_PROXY: contracts.seaportProxy.address,
    };

    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const makerOrder: Maker = {
      quoteType: QuoteType.Ask,
      globalNonce: 0,
      subsetNonce: 0,
      orderNonce: 0,
      strategyId: 0,
      collectionType,
      collection: collection.address,
      currency: currency,
      signer: maker.address,
      startTime: now,
      endTime: now + 86400, // 1 day validity
      price: constants.WeiPerEther, // 1 ETH
      itemIds,
      amounts,
      additionalParameters: constants.HashZero,
    };

    const v2 = new LooksRare(chainId, ethers.provider, buyer);
    let domain = v2.getTypedDataDomain();
    domain = { ...domain, chainId, verifyingContract: contracts.looksRareProtocol.address };

    const signature = await maker._signTypedData(domain, utils.eip712.makerTypes, makerOrder);

    // Fake an order from the API
    const makerOrderFromAPI: MakerOrderFromAPI = {
      status: "VALID",
      signature,
      strategy: makerOrder.strategyId,
      ...makerOrder,
    };

    const { tradeData, actions } = await aggregator.transformListings({
      seaport: [],
      looksRareV1: [],
      looksRareV2: [makerOrderFromAPI],
    });

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await ethers.provider.send("hardhat_setBalance", [
      buyer.address,
      balanceBeforeTx.toHexString().replace("0x0", "0x"),
    ]);

    // Approve ERC-20 to be spent by ERC20EnabledLooksRareAggregator if required
    await Promise.all(actions.map((action) => action()));

    await contracts.transferManager.connect(maker).grantApprovals([contracts.looksRareProtocol.address]);
    await collection.connect(maker).setApprovalForAll(contracts.transferManager.address, true);

    const gasEstimate = await aggregator.estimateGas(tradeData, buyer.address, true);
    expect(gasEstimate.toNumber()).to.be.closeTo(250_000, 50_000);

    return await aggregator.execute(tradeData, buyer.address, true);
  };

  it("can execute LooksRare V2 orders (Buy ERC721 with ETH)", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const tx = await executeLooksRareV2Order(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"]
    );

    const balanceBeforeTx = ethers.utils.parseEther("2");

    expect(await collection.ownerOf(1)).to.equal(buyer.address);
    expect(await collection.balanceOf(buyer.address)).to.equal(1);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });

  it("can execute LooksRare V2 orders (Buy ERC1155 with ETH)", async () => {
    const collection = contracts.collection3;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const tx = await executeLooksRareV2Order(
      signers.user3,
      collection,
      CollectionType.ERC1155,
      constants.AddressZero,
      ["3"],
      ["2"]
    );

    const balanceBeforeTx = ethers.utils.parseEther("2");

    expect(await collection.balanceOf(buyer.address, 3)).to.equal(2);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });

  it("can execute LooksRare V2 orders (Buy ERC721 with WETH)", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const buyer = signers.buyer;

    const balanceBeforeTx = ethers.utils.parseEther("2");
    await contracts.weth.mint(buyer.address, balanceBeforeTx);

    await contracts.looksRareAggregator.approve(
      contracts.weth.address,
      contracts.looksRareProtocol.address,
      ethers.constants.MaxUint256
    );

    await executeLooksRareV2Order(
      signers.user1,
      collection,
      CollectionType.ERC721,
      contracts.weth.address,
      ["1"],
      ["1"]
    );

    expect(await collection.ownerOf(1)).to.equal(buyer.address);
    expect(await collection.balanceOf(buyer.address)).to.equal(1);

    const balanceAfterTx = await contracts.weth.balanceOf(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx)).to.equal(constants.WeiPerEther);
  });

  it("can execute LooksRare V2 orders (Buy ERC1155 with WETH)", async () => {
    const collection = contracts.collection3;
    const signers = await getSigners();
    const buyer = signers.buyer;

    const balanceBeforeTx = ethers.utils.parseEther("2");
    await contracts.weth.mint(buyer.address, balanceBeforeTx);

    await contracts.looksRareAggregator.approve(
      contracts.weth.address,
      contracts.looksRareProtocol.address,
      ethers.constants.MaxUint256
    );

    await executeLooksRareV2Order(
      signers.user3,
      collection,
      CollectionType.ERC1155,
      contracts.weth.address,
      ["3"],
      ["2"]
    );

    expect(await collection.balanceOf(buyer.address, 3)).to.equal(2);

    const balanceAfterTx = await contracts.weth.balanceOf(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx)).to.equal(constants.WeiPerEther);
  });
});
