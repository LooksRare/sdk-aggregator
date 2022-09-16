import { expect } from "chai";
import { setUpContracts, Mocks } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { SupportedChainId } from "../types";
import { Addresses } from "../constants/addresses";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;
  beforeEach(async () => {
    contracts = await setUpContracts();
  });
  it("instanciate LooksRareAggregator object", () => {
    expect(new LooksRareAggregator(1).chainId).to.equal(1);
    expect(new LooksRareAggregator(SupportedChainId.HARDHAT).chainId).to.equal(SupportedChainId.HARDHAT);
    const addresses: Addresses = {
      AGGREGATOR: contracts.looksRareAggregator.address,
    };
    expect(new LooksRareAggregator(SupportedChainId.HARDHAT, addresses).addresses).to.be.eql(addresses);
  });
});
