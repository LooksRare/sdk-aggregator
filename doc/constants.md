# Constants

## Addresses

An object containing all the contract addresses for each supported chain. Refer to the [Constant type](https://github.com/LooksRare/sdk-aggregator/blob/master/src/types/constants.ts) to see the complete list of addresses.

```ts
import { addressesByNetwork } from "@looksrare/sdk-aggregator";
import { ChainId } from "@looksrare/sdk-v2";
const addresses = addressesByNetwork[ChainId.MAINNET];
```