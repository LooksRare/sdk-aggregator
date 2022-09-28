# @looksrare/sdk-aggregator

LooksRare aggregator aggregates listings from multiple sources and users can buy these NFTs in one transaction. The aggregator SDK is a JavaScript library to interact with LooksRare's aggregator contract.

## Usage

### Install

This package has a peer dependency on [@looksrare/sdk](https://github.com/LooksRare/looksrare-sdk), [@opensea/seaport-js](https://github.com/ProjectOpenSea/seaport-js), and [ethers](https://github.com/ethers-io/ethers.js/).

`yarn add @looksrare/sdk-aggregator @looksrare/sdk @opensea/seaport-js ethers`

or

`npm install @looksrare/sdk-aggregator @looksrare/sdk @opensea/seaport-js ethers`

### Documentation

Read the [complete documentation](https://github.com/LooksRare/sdk-aggregator/blob/master/doc/index.md)

## Dev

### Setup

Install dependencies with `yarn`

Dev: `yarn dev`
Build: `yarn build`

### Release
Create a personal access token (Don't change the default scope)
Create an `.env` (copy `.env.template`) and set you GitHub personal access token.
`yarn release` will run all the checks, build, and publish the package, and publish the GitHub release note.