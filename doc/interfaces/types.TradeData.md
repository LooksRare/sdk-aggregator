# Interface: TradeData

[types](../modules/types.md).TradeData

A trade object for the aggregator to process.  Each TradeData represents a batched order for a marketplace.

## Properties

### extraData

• **extraData**: `BytesLike`

Extra data for the whole transaction to be submitted to the marketplace

___

### orders

• **orders**: [`BasicOrder`](types.BasicOrder.md)[]

The orders to be executed by the proxy

___

### ordersExtraData

• **ordersExtraData**: `BytesLike`[]

Extra data for each order to be executed by the proxy

___

### proxy

• **proxy**: `string`

The marketplace proxy's contract address

___

### selector

• **selector**: `string`

The 4 bytes function selector to call the proxy

___

### value

• **value**: `BigNumber`

The amount of ETH to send to the marketplace
