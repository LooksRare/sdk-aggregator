# Interface: TransformListingsOutput

[types](../modules/types.md).TransformListingsOutput

Processed marketplace trade data together with the actions required before executing a trade

## Properties

### actions

• **actions**: () => `Promise`<`ContractTransaction`\>[]

Contract transactions that must be executed before actually executing the trade

___

### tradeData

• **tradeData**: [`TradeData`](types.TradeData.md)[]

An array of TradeData for the aggregator to process. Each TradeData represents a batched order for a marketplace
