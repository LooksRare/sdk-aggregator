import { utils, constants } from "ethers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { MakerOrderFromAPI } from "../interfaces/LooksRareV1";
import { LooksRareAggregator } from "../LooksRareAggregator";
import getFixture from "./helpers/getFixture";
import { BAYC, WETH } from "./fixtures/constants";

describe("LooksRareAggregator class", () => {
  describe("transformLooksRareV1Listings", () => {
    it("transforms LooksRare V1 listings into TradeData for the aggregator (single collection)", async () => {
      const signers = await ethers.getSigners();
      const aggregator = new LooksRareAggregator(signers[0], 1);
      const tradeData = await aggregator.transformLooksRareV1Listings([
        getFixture("LooksRareV1", "bayc3683Order.json") as MakerOrderFromAPI,
        getFixture("LooksRareV1", "bayc5623Order.json") as MakerOrderFromAPI,
      ]);

      expect(tradeData.proxy).to.equal(""); // TODO: add real address
      expect(tradeData.selector).to.equal("0x86012f2e");
      expect(tradeData.value).to.equal(utils.parseEther("149.34"));
      expect(tradeData.orders.length).to.equal(2);
      expect(tradeData.ordersExtraData.length).to.equal(2);

      const orderOne = tradeData.orders[0];
      expect(orderOne.signer).to.equal("0x550f1CaF8e15100E54099a3bdA9A979224B901d0");
      expect(orderOne.collection).to.equal(BAYC);
      expect(orderOne.collectionType).to.equal(0);
      expect(orderOne.tokenIds).to.eql(["3683"]);
      expect(orderOne.amounts).to.eql(["1"]);
      expect(orderOne.price).to.equal(utils.parseEther("74"));
      expect(orderOne.currency).to.equal(WETH);
      expect(orderOne.startTime).to.equal("1662981002");
      expect(orderOne.endTime).to.equal("1663585791");
      expect(orderOne.signature).to.equal(
        "0x43559bf4053372a781d85c2b112053b05f9d16c8adc9a32a9c608f58b5e9fc856b2697982b9171a53ee3992beebca11623108289774580bd52e0d0ddfa3274eb1c"
      );

      const orderTwo = tradeData.orders[1];
      expect(orderTwo.signer).to.equal("0x2F6ef9c28Cb0E0EdF2B0Befa74BE56Faf67FcaF3");
      expect(orderTwo.collection).to.equal(BAYC);
      expect(orderTwo.collectionType).to.equal(0);
      expect(orderTwo.tokenIds).to.eql(["5623"]);
      expect(orderTwo.amounts).to.eql(["1"]);
      expect(orderTwo.price).to.equal(utils.parseEther("75.34"));
      expect(orderTwo.currency).to.equal(WETH);
      expect(orderTwo.startTime).to.equal("1663102540");
      expect(orderTwo.endTime).to.equal("1663442119");
      expect(orderTwo.signature).to.equal(
        "0x049cd929e1c5257557823d005af629423dcd735995bb8b3cf643e3998b25b07a75d5cb9163878321c3862c51d050285c6382ce5d82a31d27a8cb64fe47a7ad2e00"
      );

      expect(tradeData.ordersExtraData[0]).to.equal(
        "0x00000000000000000000000000000000000000000000000402f4cfee62e800000000000000000000000000000000000000000000000000000000000000002134000000000000000000000000000000000000000000000000000000000000001600000000000000000000000056244bb70cbd3ea9dc8007399f61dfc065190031"
      );

      expect(tradeData.ordersExtraData[1]).to.equal(
        "0x000000000000000000000000000000000000000000000004158d72d4e1ee0000000000000000000000000000000000000000000000000000000000000000254e000000000000000000000000000000000000000000000000000000000000000500000000000000000000000056244bb70cbd3ea9dc8007399f61dfc065190031"
      );

      expect(tradeData.extraData).to.equal(constants.HashZero);
    });
  });
});
