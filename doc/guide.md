# SDK Developer Guide

## Execute a (LooksRare V1 + Seaport) order

```ts
// 1. Get LooksRare V1 listing
const collection = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
const looksRareTokenId = 1;
const seaportTokenId = 1;

let options = {method: "GET", headers: {accept: "application/json"}};

let res = await fetch(`https://api.looksrare.org/api/v2/orders?collection=${collection}&itemId=${looksRareTokenId}`, options);
let responseJson = await res.json();
const looksRareOrder = responseJson.data[0];

// 2. Get Seaport listing
options = {
  method: "GET",
  headers: {accept: "application/json", "X-API-KEY": process.env.OPENSEA_API_KEY},
};

res = await fetch(`https://api.opensea.io/v2/orders/ethereum/seaport/listings?asset_contract_address=${collection}&token_ids=${seaportTokenId}&order_by=created_date&order_direction=desc`, options);
responseJson = await res.json();
const seaportOrder = responseJson.orders[0].protocol_data;

// 3. Transform listings into LooksRare aggregator format (From the browser)
const provider = new ethers.providers.Web3Provider(web3.currentProvider);
const buyer = provider.getSigner();

// 3. Transform listings into LooksRare aggregator format (From ethers.js directly)
const privateKey = '0x......';
const rpcUrl = 'https://rpc.ankr.com/eth';
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const buyer = new ethers.Wallet(privateKey, provider);

const chainId = 1;
const aggregator = new LooksRareAggregator(signer, chainId);
const { tradeData, actions }: TransformListingsOutput = await aggregator.transformListings({
  seaport: [seaportOrder],
  looksRareV2: [looksRareOrder],
});

// Actions are required when the orders are paid in ERC-20 tokens and the buyer has not granted
// sufficient allowances to the aggregator.
await Promise.all(actions.map((action) => action()));

const isAtomic = false;

await aggregator.execute(tradeData, buyer.address, isAtomic).call();
```
