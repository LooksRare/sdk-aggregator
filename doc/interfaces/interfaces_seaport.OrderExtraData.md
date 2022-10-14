# Interface: OrderExtraData

[interfaces/seaport](../modules/interfaces_seaport.md).OrderExtraData

Seaport order extra data object inside TradeData

## Properties

### conduitKey

• **conduitKey**: `string`

Seaport order conduit key

___

### denominator

• **denominator**: `number`

Seaport trade denominator, it should be 1 for ERC721 and variable for ERC1155

___

### numerator

• **numerator**: `number`

Seaport trade numerator, it should be 1 for ERC721 and variable for ERC1155

___

### orderType

• **orderType**: `OrderType`

Seaport order type

___

### recipients

• **recipients**: [`Recipient`](interfaces_seaport.Recipient.md)[]

Sale proceed recipients

___

### salt

• **salt**: `string`

Seaport order salt

___

### zone

• **zone**: `string`

Seaport zone contract address

___

### zoneHash

• **zoneHash**: `string`

Seaport zone hash
