# Interface: BasicOrder

[types](../modules/types.md).BasicOrder

Basic order struct for each order in the TradeData object

## Properties

### amounts

• **amounts**: `BigNumberish`[]

Each token ID's amounts, must be 1 if ERC721

___

### collection

• **collection**: `string`

NFT collection address

___

### collectionType

• **collectionType**: [`CollectionType`](../enums/types.CollectionType.md)

Collection type, can be ERC721 or ERC1155

___

### currency

• **currency**: `string`

The currency of the trade, the value is 0 if ETH

___

### endTime

• **endTime**: `BigNumberish`

The timestamp when the order stops being valid

___

### price

• **price**: `BigNumberish`

Price of the trade

___

### signature

• **signature**: `BytesLike`

The maker ask's signature

___

### signer

• **signer**: `string`

Transaction caller address

___

### startTime

• **startTime**: `BigNumberish`

The timestamp when the order becomes valid

___

### tokenIds

• **tokenIds**: `BigNumberish`[]

Token IDs
