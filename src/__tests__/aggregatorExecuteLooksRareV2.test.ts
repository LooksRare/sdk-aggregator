import { expect } from "chai";
import { ethers } from "hardhat";
import calculateTxFee from "./helpers/calculateTxFee";
import { setUpContracts, Mocks, getSigners, getAddressOverrides } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { ContractMethods, TradeData } from "../types";
import { Addresses } from "../constants/addresses";
import { constants, Contract, ContractTransaction } from "ethers";
import { MakerOrderFromAPI } from "../interfaces/LooksRareV2";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { LooksRare, utils, Maker, MerkleTree, QuoteType, CollectionType, ChainId } from "@looksrare/sdk-v2";
import { setBalance } from "./helpers/setBalance";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;
  const balanceBeforeTx = ethers.utils.parseEther("4");

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  const createMakerOrderFromAPI = async (
    maker: SignerWithAddress,
    collection: Contract,
    collectionType: CollectionType,
    currency: string,
    itemIds: [string],
    amounts: [string],
    referrer?: SignerWithAddress,
    nonce = 0
  ): Promise<MakerOrderFromAPI> => {
    const chainId = ChainId.MAINNET;
    const signers = await getSigners();
    const buyer = signers.buyer;

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const now = block.timestamp;

    const merkleTree: MerkleTree = {
      root: constants.HashZero,
      proof: [],
    };

    const makerOrder: Maker = {
      quoteType: QuoteType.Ask,
      globalNonce: 0,
      subsetNonce: nonce,
      orderNonce: nonce,
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

    const signature = await maker._signTypedData(domain, utils.makerTypes, makerOrder);

    // Fake an order from the API
    return {
      merkleTree,
      signature,
      referrer: referrer && {
        rate: 0,
        address: referrer.address,
      },
      ...makerOrder,
    };
  };

  const executeAggregator = async (
    maker: SignerWithAddress,
    collection: Contract,
    makerOrdersFromAPI: Array<MakerOrderFromAPI>
  ): Promise<ContractTransaction> => {
    const chainId = ChainId.MAINNET;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const addresses: Addresses = getAddressOverrides(contracts);

    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);

    const { tradeData, actions } = await aggregator.transformListings({
      seaport_V1_4: [],
      seaport_V1_5: [],
      looksRareV2: makerOrdersFromAPI,
    });

    await setBalance(buyer.address, balanceBeforeTx);

    // Approve ERC-20 to be spent by ERC20EnabledLooksRareAggregator if required
    await Promise.all(actions.map((action) => action()));

    await contracts.transferManager.connect(maker).grantApprovals([contracts.looksRareProtocol.address]);
    await collection.connect(maker).setApprovalForAll(contracts.transferManager.address, true);

    const contractMethods: ContractMethods = aggregator.execute(tradeData, buyer.address, true);

    const gasEstimate = await contractMethods.estimateGas();
    expect(gasEstimate.toNumber()).to.be.greaterThan(0);

    return await contractMethods.call();
  };

  const executeSingleLooksRareV2Order = async (
    maker: SignerWithAddress,
    collection: Contract,
    collectionType: CollectionType,
    currency: string,
    itemIds: [string],
    amounts: [string],
    referrer: SignerWithAddress
  ): Promise<ContractTransaction> => {
    const makerOrderFromAPI = await createMakerOrderFromAPI(
      maker,
      collection,
      collectionType,
      currency,
      itemIds,
      amounts,
      referrer
    );

    return await executeAggregator(maker, collection, [makerOrderFromAPI]);
  };

  it("can execute LooksRare V2 orders (Buy ERC721 with ETH)", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const tx = await executeSingleLooksRareV2Order(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user2
    );

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
    const tx = await executeSingleLooksRareV2Order(
      signers.user3,
      collection,
      CollectionType.ERC1155,
      constants.AddressZero,
      ["3"],
      ["2"],
      signers.user2
    );

    expect(await collection.balanceOf(buyer.address, 3)).to.equal(2);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });

  it("can execute LooksRare V2 orders (Buy ERC721 with WETH)", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const buyer = signers.buyer;

    await contracts.weth.mint(buyer.address, balanceBeforeTx);

    await contracts.looksRareAggregator.approve(
      contracts.weth.address,
      contracts.looksRareProtocol.address,
      ethers.constants.MaxUint256
    );

    await executeSingleLooksRareV2Order(
      signers.user1,
      collection,
      CollectionType.ERC721,
      contracts.weth.address,
      ["1"],
      ["1"],
      signers.user2
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

    await contracts.weth.mint(buyer.address, balanceBeforeTx);

    await contracts.looksRareAggregator.approve(
      contracts.weth.address,
      contracts.looksRareProtocol.address,
      ethers.constants.MaxUint256
    );

    await executeSingleLooksRareV2Order(
      signers.user3,
      collection,
      CollectionType.ERC1155,
      contracts.weth.address,
      ["3"],
      ["2"],
      signers.user2
    );

    expect(await collection.balanceOf(buyer.address, 3)).to.equal(2);

    const balanceAfterTx = await contracts.weth.balanceOf(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx)).to.equal(constants.WeiPerEther);
  });

  it("can group orders with different referrers into different TradeData", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const chainId = ChainId.MAINNET;
    const addresses: Addresses = getAddressOverrides(contracts);
    const buyer = signers.buyer;
    const makerOrderUser1 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user2
    );
    const makerOrderUser2 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user2
    );
    const makerOrderUser3 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user3
    );

    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);
    const { tradeData } = await aggregator.transformListings({
      seaport_V1_4: [],
      seaport_V1_5: [],
      looksRareV2: [makerOrderUser1, makerOrderUser2, makerOrderUser3],
    });

    const user2Bytes = ethers.utils.defaultAbiCoder.encode(["address"], [signers.user2.address]);
    const user3Bytes = ethers.utils.defaultAbiCoder.encode(["address"], [signers.user3.address]);

    expect(tradeData.length).to.equal(2);
    tradeData.forEach((td: TradeData) => {
      if (td.orders.length == 2) {
        expect(td.extraData).to.equal(user2Bytes);
      } else if (td.orders.length == 1) {
        expect(td.extraData).to.equal(user3Bytes);
      } else {
        expect.fail("failed order grouping by referrer");
      }
    });
  });

  it("can group orders with no referrer into same TradeData", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const chainId = ChainId.MAINNET;
    const addresses: Addresses = getAddressOverrides(contracts);
    const buyer = signers.buyer;
    const makerOrderUser1 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"]
    );
    const makerOrderUser2 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"]
    );
    const makerOrderUser3 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user3
    );

    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);
    const { tradeData } = await aggregator.transformListings({
      seaport_V1_4: [],
      seaport_V1_5: [],
      looksRareV2: [makerOrderUser1, makerOrderUser2, makerOrderUser3],
    });

    const user3Bytes = ethers.utils.defaultAbiCoder.encode(["address"], [signers.user3.address]);

    expect(tradeData.length).to.equal(2);
    tradeData.forEach((td: TradeData) => {
      if (td.orders.length == 2) {
        expect(td.extraData).to.equal(constants.HashZero);
      } else if (td.orders.length == 1) {
        expect(td.extraData).to.equal(user3Bytes);
      } else {
        expect.fail("failed order grouping by referrer");
      }
    });
  });

  it("can group orders with same referrers into single TradeData", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const chainId = ChainId.MAINNET;
    const addresses: Addresses = getAddressOverrides(contracts);
    const buyer = signers.buyer;
    const makerOrderUser1 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user2
    );
    const makerOrderUser2 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user2
    );

    const aggregator = new LooksRareAggregator(buyer, chainId, addresses);
    const { tradeData } = await aggregator.transformListings({
      seaport_V1_4: [],
      seaport_V1_5: [],
      looksRareV2: [makerOrderUser1, makerOrderUser2],
    });

    const user2Bytes = ethers.utils.defaultAbiCoder.encode(["address"], [signers.user2.address]);

    expect(tradeData.length).to.equal(1);
    expect(tradeData[0].extraData).to.equal(user2Bytes);
  });

  it("can execute orders with multiple referrers", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const makerOrderUser1 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["1"],
      ["1"],
      signers.user2,
      0
    );
    const makerOrderUser2 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["2"],
      ["1"],
      signers.user2,
      1
    );
    const makerOrderUser3 = await createMakerOrderFromAPI(
      signers.user1,
      collection,
      CollectionType.ERC721,
      constants.AddressZero,
      ["3"],
      ["1"],
      signers.user3,
      2
    );

    const tx = await executeAggregator(signers.user1, collection, [makerOrderUser1, makerOrderUser2, makerOrderUser3]);

    expect(await collection.ownerOf(1)).to.equal(buyer.address);
    expect(await collection.balanceOf(buyer.address)).to.equal(3);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther.mul(3));
  });
});
