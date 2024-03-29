import { Contract } from "ethers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { LooksRareAggregator } from "../../typechain/@looksrare/contracts-aggregator/contracts/LooksRareAggregator";
import type { ERC20EnabledLooksRareAggregator } from "../../typechain/@looksrare/contracts-aggregator/contracts/ERC20EnabledLooksRareAggregator";
import type { LooksRareProxy } from "../../typechain/@looksrare/contracts-aggregator/contracts/proxies/LooksRareProxy";
import type { LooksRareV2Proxy } from "../../typechain/@looksrare/contracts-aggregator/contracts/proxies/LooksRareV2Proxy";
import type { SeaportProxy } from "../../typechain/@looksrare/contracts-aggregator/contracts/proxies/SeaportProxy";
import type { MockERC721 } from "../../typechain/src/contracts/tests/MockERC721";
import type { MockERC1155 } from "../../typechain/src/contracts/tests/MockERC1155";
import type { MockERC20 } from "../../typechain/src/contracts/tests/MockERC20";
import { PROXY_EXECUTE_SELECTOR } from "../../constants/selectors";
import { addressesByNetwork } from "@looksrare/sdk";
import { TransferManager } from "../../typechain/@looksrare/contracts-exchange-v2/contracts/TransferManager";
import { LooksRareProtocol } from "../../typechain/@looksrare/contracts-exchange-v2/contracts/LooksRareProtocol";
import { Addresses } from "../../constants/addresses";
import { ChainId } from "@looksrare/sdk-v2";
import { CROSS_CHAIN_SEAPORT_V1_4_ADDRESS, CROSS_CHAIN_SEAPORT_V1_5_ADDRESS } from "@opensea/seaport-js/lib/constants";

chai.use(chaiAsPromised);

export interface Signers {
  owner: SignerWithAddress;
  operator: SignerWithAddress;
  buyer: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  user3: SignerWithAddress;
}

export interface Mocks {
  looksRareProtocol: LooksRareProtocol;
  transferManager: TransferManager;
  looksRareAggregator: LooksRareAggregator;
  erc20EnabledLooksRareAggregator: ERC20EnabledLooksRareAggregator;
  looksRareProxy: LooksRareProxy;
  looksRareV2Proxy: LooksRareV2Proxy;
  seaport_V1_4_Proxy: SeaportProxy;
  seaport_V1_5_Proxy: SeaportProxy;
  collection1: MockERC721;
  collection2: MockERC721;
  collection3: MockERC1155;
  weth: MockERC20;
  usdc: MockERC20;
}

export const NB_NFT_PER_USER = 5;

export const getSigners = async (): Promise<Signers> => {
  const signers = await ethers.getSigners();
  return {
    owner: signers[0],
    operator: signers[1],
    buyer: signers[2],
    user1: signers[3],
    user2: signers[4],
    user3: signers[5],
  };
};

const deploy = async (name: string, ...args: any[]): Promise<Contract> => {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);
  await contract.deployed();
  return contract;
};

export const setUpContracts = async (): Promise<Mocks> => {
  const signers = await getSigners();
  const weth = (await deploy("MockERC20", "MockWETH", "WETH", 18)) as MockERC20;
  const usdc = (await deploy("MockERC20", "MockUSDC", "USDC", 6)) as MockERC20;

  // Operations
  const transferManager = (await deploy("TransferManager", signers.owner.address)) as TransferManager;
  const looksRareProtocol = (await deploy(
    "LooksRareProtocol",
    signers.owner.address,
    signers.owner.address,
    transferManager.address,
    weth.address
  )) as LooksRareProtocol;
  await transferManager.connect(signers.owner).allowOperator(looksRareProtocol.address);
  await looksRareProtocol.connect(signers.owner).updateCurrencyStatus(ethers.constants.AddressZero, true);
  await looksRareProtocol.connect(signers.owner).updateCurrencyStatus(weth.address, true);
  // We don't need to update creator fee manager unless we need OrderValidatorV2A

  // Deploy contracts
  const looksRareAggregator = (await deploy("LooksRareAggregator", signers.owner.address)) as LooksRareAggregator;
  const erc20EnabledLooksRareAggregator = (await deploy(
    "ERC20EnabledLooksRareAggregator",
    looksRareAggregator.address
  )) as ERC20EnabledLooksRareAggregator;
  const looksRareProxy = (await deploy(
    "LooksRareProxy",
    addressesByNetwork[ChainId.MAINNET].EXCHANGE,
    looksRareAggregator.address
  )) as LooksRareProxy;
  const seaport_V1_4_Proxy = (await deploy(
    "SeaportProxy",
    CROSS_CHAIN_SEAPORT_V1_4_ADDRESS,
    looksRareAggregator.address
  )) as SeaportProxy;
  const seaport_V1_5_Proxy = (await deploy(
    "SeaportProxy",
    CROSS_CHAIN_SEAPORT_V1_5_ADDRESS,
    looksRareAggregator.address
  )) as SeaportProxy;
  const looksRareV2Proxy = (await deploy(
    "LooksRareV2Proxy",
    looksRareProtocol.address,
    looksRareAggregator.address
  )) as LooksRareV2Proxy;

  await looksRareAggregator.setERC20EnabledLooksRareAggregator(erc20EnabledLooksRareAggregator.address);
  await looksRareAggregator.addFunction(looksRareProxy.address, PROXY_EXECUTE_SELECTOR);
  await looksRareAggregator.addFunction(seaport_V1_4_Proxy.address, PROXY_EXECUTE_SELECTOR);
  await looksRareAggregator.addFunction(seaport_V1_5_Proxy.address, PROXY_EXECUTE_SELECTOR);
  await looksRareAggregator.addFunction(looksRareV2Proxy.address, PROXY_EXECUTE_SELECTOR);

  const collection1 = (await deploy("MockERC721", "Collection1", "COL1")) as MockERC721;
  const collection2 = (await deploy("MockERC721", "Collection2", "COL2")) as MockERC721;
  const collection3 = (await deploy("MockERC1155")) as MockERC1155;
  const collection4 = (await deploy("MockERC721", "Collection4", "COL4")) as MockERC721;

  // Setup balances
  const promises = [];
  for (let i = 0; i < NB_NFT_PER_USER; i++) {
    promises.push(collection1.mint(signers.user1.address, i));
    promises.push(collection2.mint(signers.user2.address, i));
    promises.push(collection3.mint(signers.user3.address, i, 10));
    promises.push(collection4.mint(signers.user1.address, i));
  }
  await Promise.all(promises);

  return {
    looksRareProtocol,
    transferManager,
    looksRareAggregator,
    erc20EnabledLooksRareAggregator,
    looksRareProxy,
    looksRareV2Proxy,
    seaport_V1_4_Proxy,
    seaport_V1_5_Proxy,
    collection1,
    collection2,
    collection3,
    weth,
    usdc,
  };
};

export const getAddressOverrides = (contracts: Mocks): Addresses => {
  return {
    AGGREGATOR: contracts.looksRareAggregator.address,
    ERC20_ENABLED_AGGREGATOR: contracts.erc20EnabledLooksRareAggregator.address,
    LOOKSRARE_V2_PROXY: contracts.looksRareV2Proxy.address,
    SEAPORT_V1_4_PROXY: contracts.seaport_V1_4_Proxy.address,
    SEAPORT_V1_5_PROXY: contracts.seaport_V1_5_Proxy.address,
  };
};
