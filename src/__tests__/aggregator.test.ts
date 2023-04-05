import { expect } from "chai";
import { setUpContracts, Mocks, getSigners, getAddressOverrides } from "./helpers/setup";
import { LooksRareAggregator } from "../LooksRareAggregator";
import { Addresses } from "../constants/addresses";
import { ChainId } from "@looksrare/sdk-v2";

describe("LooksRareAggregator class", () => {
  let contracts: Mocks;

  beforeEach(async () => {
    contracts = await setUpContracts();
  });

  it("instanciate LooksRareAggregator object", async () => {
    const signers = await getSigners();
    const signer = signers.user1;
    expect(new LooksRareAggregator(signer, 1).chainId).to.equal(1);
    expect(new LooksRareAggregator(signer, ChainId.HARDHAT).chainId).to.equal(ChainId.HARDHAT);
    const addresses: Addresses = getAddressOverrides(contracts);
    expect(new LooksRareAggregator(signer, ChainId.HARDHAT, addresses).addresses).to.be.eql(addresses);
  });
});
