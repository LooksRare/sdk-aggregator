# Class: LooksRareAggregator

[LooksRareAggregator](../modules/LooksRareAggregator.md).LooksRareAggregator

## Constructors

### constructor

• **new LooksRareAggregator**(`signer`, `chainId`, `override?`)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signer` | `Signer` | The signer of transactions (NFT buyer) |
| `chainId` | [`SupportedChainId`](../enums/types.SupportedChainId.md) | Current app chain ID |
| `override?` | [`Addresses`](../interfaces/constants_addresses.Addresses.md) | Aggregator and proxy addresses override.                 Only required if the SDK does not have                 the contract addresses for the given chainId |

## Properties

### addresses

• `Readonly` **addresses**: [`Addresses`](../interfaces/constants_addresses.Addresses.md)

Mapping of LooksRare aggregator addresses for the current chain

___

### chainId

• `Readonly` **chainId**: [`SupportedChainId`](../enums/types.SupportedChainId.md)

Current app chain ID

___

### signer

• `Readonly` **signer**: `Signer`

The signer of transactions (NFT buyer)

**`See`**

https://docs.ethers.io/v5/api/signer/

## Methods

### execute

▸ **execute**(`tradeData`, `recipient`, `isAtomic`): `Promise`<`ContractTransaction`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `tradeData` | [`TradeData`](../interfaces/types.TradeData.md)[] | An array of TradeData for the aggregator to process.                  Each TradeData represents a batched order for a marketplace |
| `recipient` | `string` | The recipient of the purchased NFTs |
| `isAtomic` | `boolean` | Whether the transaction should revert if one of the trades fails |

#### Returns

`Promise`<`ContractTransaction`\>

The executed contract transaction

___

### transactionEthValue

▸ `Private` **transactionEthValue**(`tradeData`): `BigNumber`

#### Parameters

| Name | Type |
| :------ | :------ |
| `tradeData` | [`TradeData`](../interfaces/types.TradeData.md)[] |

#### Returns

`BigNumber`

___

### transactionTokenTransfers

▸ `Private` **transactionTokenTransfers**(`tradeData`): [`TokenTransfer`](../interfaces/types.TokenTransfer.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `tradeData` | [`TradeData`](../interfaces/types.TradeData.md)[] |

#### Returns

[`TokenTransfer`](../interfaces/types.TokenTransfer.md)[]

___

### transformListings

▸ **transformListings**(`listings`): `Promise`<[`TransformListingsOutput`](../interfaces/types.TransformListingsOutput.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listings` | [`Listings`](../interfaces/types.Listings.md) | LooksRare and Seaport listings, directly fetched from the API |

#### Returns

`Promise`<[`TransformListingsOutput`](../interfaces/types.TransformListingsOutput.md)\>

Transformed listings that are ready to be consumed by the execute function.
         If the returned actions array is not empty, the contract transactions in the array
         (ERC20 approvals) have to be executed first before calling the execute function.

___

### transformLooksRareV1Listings

▸ **transformLooksRareV1Listings**(`listings`): `Promise`<[`TradeData`](../interfaces/types.TradeData.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `listings` | [`MakerOrderFromAPI`](../interfaces/interfaces_LooksRareV1.MakerOrderFromAPI.md)[] |

#### Returns

`Promise`<[`TradeData`](../interfaces/types.TradeData.md)\>

___

### transformSeaportListings

▸ **transformSeaportListings**(`listings`): [`TradeData`](../interfaces/types.TradeData.md)

**`Notice`**

The argument comes from Seaport listings API response's orders->protocol_data

#### Parameters

| Name | Type |
| :------ | :------ |
| `listings` | `Order`[] |

#### Returns

[`TradeData`](../interfaces/types.TradeData.md)
