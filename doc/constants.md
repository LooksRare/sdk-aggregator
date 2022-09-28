# Constants

## Addresses

An object containing all the contract addresses for each supported chain. Refer to the [Constant type](https://github.com/LooksRare/sdk-aggregator/blob/master/src/types/constants.ts) to see the complete list of addresses.

```ts
import { addressesByNetwork, SupportedChainId } from "@looksrare/sdk-aggregator";
const addresses = addressesByNetwork[SupportedChainId.MAINNET];
```