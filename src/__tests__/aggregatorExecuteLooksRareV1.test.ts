import { expect } from "chai";
import { ethers } from "hardhat";
import { setUpContracts, Mocks, getSigners, getAddressOverrides } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";
import { addressesByNetwork, MakerOrder, generateMakerOrderTypedData } from "@looksrare/sdk";
import { constants, Contract, ContractTransaction } from "ethers";
import { MakerOrderFromAPI } from "../interfaces/LooksRareV1";
import calculateTxFee from "./helpers/calculateTxFee";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  const executeLooksRareV1Order = async (
    maker: SignerWithAddress,
    collection: Contract,
    tokenId: string,
    amount: string,
    transferManager: string
  ): Promise<ContractTransaction> => {
    const chainId = SupportedChainId.MAINNET;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const addresses: Addresses = getAddressOverrides(contracts);
    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const makerOrder: MakerOrder = {
      isOrderAsk: true,
      signer: maker.address,
      collection: collection.address,
      price: constants.WeiPerEther, // 1 ETH
      tokenId,
      amount,
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

    const { tradeData } = await aggregator.transformListings({
      seaport: [],
      looksRareV1: [makerOrderFromAPI],
      looksRareV2: [],
    });

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await ethers.provider.send("hardhat_setBalance", [
      buyer.address,
      balanceBeforeTx.toHexString().replace("0x0", "0x"),
    ]);

    await collection.connect(maker).setApprovalForAll(transferManager, true);

    const gasEstimate = await aggregator.estimateGas(tradeData, buyer.address, true);
    expect(gasEstimate.toNumber()).to.be.closeTo(370_500, 7_000);

    return await aggregator.execute(tradeData, buyer.address, true);
  };

  it("can execute LooksRare V1 orders (ERC721)", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const tx = await executeLooksRareV1Order(
      signers.user1,
      contracts.collection1,
      "1",
      "1",
      addressesByNetwork[SupportedChainId.MAINNET].TRANSFER_MANAGER_ERC721
    );

    const balanceBeforeTx = ethers.utils.parseEther("2");

    expect(await collection.ownerOf(1)).to.equal(buyer.address);
    expect(await collection.balanceOf(buyer.address)).to.equal(1);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });

  it("can execute LooksRare V1 orders (ERC1155)", async () => {
    const collection = contracts.collection3;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const tx = await executeLooksRareV1Order(
      signers.user3,
      collection,
      "3",
      "2",
      addressesByNetwork[SupportedChainId.MAINNET].TRANSFER_MANAGER_ERC1155
    );

    const balanceBeforeTx = ethers.utils.parseEther("2");

    expect(await collection.balanceOf(buyer.address, 3)).to.equal(2);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });
});
