import { Contract } from "ethers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { LooksRareAggregator } from "../../../typechain/@looksrare/contracts-aggregator/contracts/LooksRareAggregator";
import type { LooksRareProxy } from "../../../typechain/@looksrare/contracts-aggregator/contracts/proxies/LooksRareProxy";
import type { SeaportProxy } from "../../../typechain/@looksrare/contracts-aggregator/contracts/proxies/SeaportProxy";
import type { MockERC721 } from "../../../typechain/src/contracts/tests/MockERC721";
import type { MockERC1155 } from "../../../typechain/src/contracts/tests/MockERC1155";
import type { MockERC20 } from "../../../typechain/src/contracts/tests/MockERC20";
import { PROXY_EXECUTE_SELECTOR } from "../../constants/selectors";
import { CROSS_CHAIN_SEAPORT_ADDRESS } from "@opensea/seaport-js/lib/constants";

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
  looksRareAggregator: LooksRareAggregator;
  looksRareProxy: LooksRareProxy;
  seaportProxy: SeaportProxy;
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

const LOOKSRARE = "0x59728544B08AB483533076417FbBB2fD0B17CE3a";
export const LOOKSRARE_TRANSFER_MANAGER = "0xf42aa99F011A1fA7CDA90E5E98b277E306BcA83e";

export const setUpContracts = async (): Promise<Mocks> => {
  // Deploy contracts
  const looksRareAggregator = (await deploy("LooksRareAggregator")) as LooksRareAggregator;
  const looksRareProxy = (await deploy("LooksRareProxy", LOOKSRARE, looksRareAggregator.address)) as LooksRareProxy;
  const seaportProxy = (await deploy(
    "SeaportProxy",
    CROSS_CHAIN_SEAPORT_ADDRESS,
    looksRareAggregator.address
  )) as SeaportProxy;

  await looksRareAggregator.addFunction(looksRareProxy.address, PROXY_EXECUTE_SELECTOR);

  await looksRareAggregator.addFunction(seaportProxy.address, PROXY_EXECUTE_SELECTOR);

  const collection1 = (await deploy("MockERC721", "Collection1", "COL1")) as MockERC721;
  const collection2 = (await deploy("MockERC721", "Collection2", "COL2")) as MockERC721;
  const collection3 = (await deploy("MockERC1155")) as MockERC1155;
  const collection4 = (await deploy("MockERC721", "Collection4", "COL4")) as MockERC721;
  const weth = (await deploy("MockERC20", "MockWETH", "WETH", 18)) as MockERC20;
  const usdc = (await deploy("MockERC20", "MockUSDC", "USDC", 6)) as MockERC20;

  // Setup balances
  const signers = await getSigners();
  const promises = [];
  for (let i = 0; i < NB_NFT_PER_USER; i++) {
    promises.push(collection1.mint(signers.user1.address, i));
    promises.push(collection2.mint(signers.user2.address, i));
    promises.push(collection3.mint(signers.user3.address, i, 10));
    promises.push(collection4.mint(signers.user1.address, i));
  }
  await Promise.all(promises);

  return {
    looksRareAggregator,
    looksRareProxy,
    seaportProxy,
    collection1,
    collection2,
    collection3,
    weth,
    usdc,
  };
};
