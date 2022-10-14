# Module: interfaces/seaport

## Interfaces

- [OrderExtraData](../interfaces/interfaces_seaport.OrderExtraData.md)
- [Recipient](../interfaces/interfaces_seaport.Recipient.md)

## Variables

### EXTRA\_DATA\_SCHEMA

• `Const` **EXTRA\_DATA\_SCHEMA**: ``"\n  tuple(\n    tuple(uint256 orderIndex, uint256 itemIndex)[][] offerFulfillments,\n    tuple(uint256 orderIndex, uint256 itemIndex)[][] considerationFulfillments\n  )\n"``

Seaport extra data schema

___

### ORDER\_EXTRA\_DATA\_SCHEMA

• `Const` **ORDER\_EXTRA\_DATA\_SCHEMA**: ``"\n  tuple(\n    uint120 numerator,\n    uint120 denominator,\n    uint8 orderType,\n    address zone,\n    bytes32 zoneHash,\n    uint256 salt,\n    bytes32 conduitKey,\n    tuple(uint256 amount, address recipient)[] recipients\n  ) orderExtraData\n"``

Seaport order extra data schema
