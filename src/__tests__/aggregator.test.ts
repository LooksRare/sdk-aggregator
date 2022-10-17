import { expect } from "chai";
import { setUpContracts, Mocks, getSigners } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  it("instanciate LooksRareAggregator object", async () => {
    const signers = await getSigners();
    const signer = signers.user1;
    expect(new LooksRareAggregator(signer, 1).chainId).to.equal(1);
    expect(new LooksRareAggregator(signer, SupportedChainId.HARDHAT).chainId).to.equal(SupportedChainId.HARDHAT);
    const addresses: Addresses = {
      AGGREGATOR: contracts.looksRareAggregator.address,
      ERC20_ENABLED_AGGREGATOR: contracts.erc20EnabledLooksRareAggregator.address,
      LOOKSRARE_V1_PROXY: contracts.looksRareProxy.address,
      SEAPORT_PROXY: contracts.seaportProxy.address,
    };
    expect(new LooksRareAggregator(signer, SupportedChainId.HARDHAT, addresses).addresses).to.be.eql(addresses);
  });
});
