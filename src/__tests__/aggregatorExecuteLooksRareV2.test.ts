import { expect } from "chai";
import { ethers } from "hardhat";
import calculateTxFee from "./helpers/calculateTxFee";
import { setUpContracts, Mocks, getSigners } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { CollectionType, SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";
import { constants, Contract, ContractTransaction, TypedDataField } from "ethers";
import { MakerOrderFromAPI, QuoteType } from "../interfaces/LooksRareV2";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

type EIP712TypedData = Record<string, Array<TypedDataField>>;

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  const executeLooksRareV2Order = async (
    maker: SignerWithAddress,
    collection: Contract,
    collectionType: CollectionType,
    itemIds: [string],
    amounts: [string],
    transferManager: string
  ): Promise<ContractTransaction> => {
    const chainId = SupportedChainId.GOERLI;
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

    const makerOrder = {
    // const makerOrder: MakerOrder = {
      quoteType: QuoteType.Ask,
      globalNonce: 0,
      subsetNonce: 0,
      orderNonce: 0,
      strategyId: 0,
      collectionType,
      collection: collection.address,
      currency: constants.AddressZero, // TODO: Check WETH
      signer: maker.address,
      startTime: now,
      endTime: now + 86400, // 1 day validity
      price: constants.WeiPerEther, // 1 ETH
      itemIds,
      amounts,
      additionalParameters: [],
    };
    // const { domain, value, type } = generateMakerOrderTypedData(maker.address, chainId, makerOrder);
    // TODO: Use SDK V2's
    const domain = {
      name: "LooksRareProtocol",
      version: "2",
      chainId,
      verifyingContract: "0x35C2215F2FFe8917B06454eEEaba189877F200cf",
    };

    const type: EIP712TypedData = {
      Maker: [
        { name: "quoteType", type: "uint8" },
        { name: "globalNonce", type: "uint256" },
        { name: "subsetNonce", type: "uint256" },
        { name: "orderNonce", type: "uint256" },
        { name: "strategyId", type: "uint256" },
        { name: "collectionType", type: "uint8" },
        { name: "collection", type: "address" },
        { name: "currency", type: "address" },
        { name: "signer", type: "address" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "itemIds", type: "uint256[]" },
        { name: "amounts", type: "uint256[]" },
        { name: "additionalParameters", type: "bytes" },
      ],
    };

    // TODO end
    const signature = await maker._signTypedData(domain, type, makerOrder);

    // Fake an order from the API
    const makerOrderFromAPI: MakerOrderFromAPI = {
      status: "VALID",
      signature,
      ...makerOrder,
    };

    const { tradeData } = await aggregator.transformListings({
      seaport: [],
      looksRareV1: [],
      looksRareV2: [makerOrderFromAPI],
    });

    const balanceBeforeTx = ethers.utils.parseEther("2");

    await ethers.provider.send("hardhat_setBalance", [
      buyer.address,
      balanceBeforeTx.toHexString().replace("0x0", "0x"),
    ]);

    await collection.connect(maker).setApprovalForAll(transferManager, true);

    return await aggregator.execute(tradeData, buyer.address, true);
  };

  it("can execute LooksRare V2 orders (ERC721)", async () => {
    const collection = contracts.collection1;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const tx = await executeLooksRareV2Order(
      signers.user1,
      contracts.collection1,
      CollectionType.ERC721,
      ["1"],
      ["1"],
      "0xC20E0CeAD98abBBEb626B77efb8Dc1E5D781f90c",
      // TODO: When V2 SDK is ready
      // addressesByNetwork[SupportedChainId.GOERLI].TRANSFER_MANAGER_V2
    );

    const balanceBeforeTx = ethers.utils.parseEther("2");

    expect(await collection.ownerOf(1)).to.equal(buyer.address);
    expect(await collection.balanceOf(buyer.address)).to.equal(1);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });

  it("can execute LooksRare V2 orders (ERC1155)", async () => {
    const collection = contracts.collection3;
    const signers = await getSigners();
    const buyer = signers.buyer;
    const tx = await executeLooksRareV2Order(
      signers.user3,
      collection,
      CollectionType.ERC1155,
      ["3"],
      ["2"],
      "0xC20E0CeAD98abBBEb626B77efb8Dc1E5D781f90c",
      // TODO: When V2 SDK is ready
      // addressesByNetwork[SupportedChainId.GOERLI].TRANSFER_MANAGER_ERC1155
    );

    const balanceBeforeTx = ethers.utils.parseEther("2");

    expect(await collection.balanceOf(buyer.address, 3)).to.equal(2);

    const txFee = await calculateTxFee(tx);
    const balanceAfterTx = await ethers.provider.getBalance(buyer.address);
    expect(balanceBeforeTx.sub(balanceAfterTx).sub(txFee)).to.equal(constants.WeiPerEther);
  });
});
