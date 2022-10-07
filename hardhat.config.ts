import { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-abi-exporter";

dotenv.config();

if (!process.env.ETH_RPC_URL) {
  throw new Error("Missing env key ETH_RPC_URL");
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      chainId: process.env.HARDHAT_CHAIN_ID ? Number(process.env.HARDHAT_CHAIN_ID) : 31337,
      forking: {
        url: process.env.ETH_RPC_URL,
        blockNumber: process.env.FORKED_BLOCK_NUMBER ? Number(process.env.FORKED_BLOCK_NUMBER) : undefined,
      },
      hardfork: "berlin", // Berlin is used (temporarily) to avoid issues with coverage
      mining: {
        auto: true,
        interval: 50000,
      },
      gasPrice: "auto",
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  abiExporter: {
    path: "./src/abis",
    runOnCompile: true,
    clear: true,
    flat: true,
    format: "fullName",
    except: ["contracts/tests/*", "@rari-capital"],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  paths: {
    tests: "src/__tests__",
    artifacts: "artifacts",
    sources: "src/contracts",
  },
};

export default config;
