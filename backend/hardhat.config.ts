import { promises as fs } from 'fs';
import path from 'path';

import {JsonRpcProvider} from "@ethersproject/providers";
import "@nomiclabs/hardhat-ethers"
import '@oasisprotocol/sapphire-hardhat';
import '@typechain/hardhat';
import canonicalize from 'canonicalize';
import 'hardhat-watcher';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { HardhatUserConfig, task } from 'hardhat/config';
import 'solidity-coverage';
import {Slot} from "./typechain-types";

const TASK_EXPORT_ABIS = 'export-abis';

task(TASK_COMPILE, async (_args, hre, runSuper) => {
  await runSuper();
  await hre.run(TASK_EXPORT_ABIS);
});

task(TASK_EXPORT_ABIS, async (_args, hre) => {
  const srcDir = path.basename(hre.config.paths.sources);
  const outDir = path.join(hre.config.paths.root, 'abis');

  const [artifactNames] = await Promise.all([
    hre.artifacts.getAllFullyQualifiedNames(),
    fs.mkdir(outDir, { recursive: true }),
  ]);

  await Promise.all(
    artifactNames.map(async (fqn) => {
      const { abi, contractName, sourceName } = await hre.artifacts.readArtifact(fqn);
      if (abi.length === 0 || !sourceName.startsWith(srcDir) || contractName.endsWith('Test'))
        return;
      await fs.writeFile(`${path.join(outDir, contractName)}.json`, `${canonicalize(abi)}\n`);
    }),
  );
});

// Unencrypted contract deployment.
task('deploy')
  .addPositionalParam("maxRewardRatio", "Share of the pool to be awarded in 1/256.", "128")
  .addPositionalParam("winRatio", "Probability of a player to win in 1/256.", "1")
  .addPositionalParam("ticketPrice", "Required amount of tokens to be payed.", "10")
  .setAction(async (args, hre) => {
    await hre.run('compile');

    // Unwrap the provider.
    const uwProvider = new JsonRpcProvider(hre.network.config.url);
    const Slot = await hre.ethers.getContractFactory('Slot', new hre.ethers.Wallet(accounts[0], uwProvider));
//    const Slot = await hre.ethers.getContractFactory('Slot');
    const slot = await Slot.deploy();
    await slot.deployed();

    console.log(`Deploying using account: ${(await hre.ethers.getSigner(0)).address}`);
    console.log(`Slot address: ${slot.address}`);
    await setParameters(slot.address, args.maxRewardRatio, args.winRatio, args.ticketPrice);

    saveFrontendFiles(slot);
    return slot;
  });

task('setParameters')
  .addPositionalParam("contract", "Address of the contract")
  .addPositionalParam("maxRewardRatio", "Share of the pool to be awarded in 1/256.", "128")
  .addPositionalParam("winRatio", "Probability of a player to win in 1/256.", "1")
  .addPositionalParam("ticketPrice", "Required amount of tokens per ticket to be payed.", "10")
  .setAction(async (args, hre) => {
    await hre.run('compile');

    await setParameters(args.contract, args.maxRewardRatio, args.winRatio, args.ticketPrice);
  });

task('enable')
  .addPositionalParam("contract", "Address of the contract")
  .setAction(async (args, hre) => {
    await hre.run('compile');

    const slot = await ethers.getContractAt("Slot", args.contract);
    const tx = await slot.setEnabled(true);
    await tx.wait();
  });

task('disable')
  .addPositionalParam("contract", "Address of the contract")
  .setAction(async (args, hre) => {
    await hre.run('compile');

    const slot = await ethers.getContractAt("Slot", args.contract);
    const tx = await slot.setEnabled(false);
    await tx.wait();
  });

task('deposit')
  .addPositionalParam("contract", "Address of the contract")
  .addPositionalParam("amount", "Amount of tokens to withdraw")
  .setAction(async (args, hre) => {
    await hre.run('compile');

    console.log("Depositing tokens...")
    const uwProvider = new JsonRpcProvider(hre.network.config.url);
    const slot = await ethers.getContractAt("Slot", args.contract, new ethers.Wallet(accounts[0], uwProvider));

    const tx = {
      from: (await ethers.getSigner(0)).address,
      to: slot.address,
      value: ethers.utils.parseEther(args.amount),
      nonce: await (await ethers.getSigner(0)).getTransactionCount(),
      gasLimit: 100_000, // 100000
      gasPrice: 100_000_000_000,
    };

    const s = await ethers.getSigner(0);
    await s.sendTransaction(tx);
  });

task('withdraw')
  .addPositionalParam("contract", "Address of the contract")
  .addPositionalParam("amount", "Amount of tokens to withdraw")
  .setAction(async (args, hre) => {
    await hre.run('compile');

    console.log("Withdrawing tokens...")
    const slot = await ethers.getContractAt("Slot", args.contract);
    const tx = await slot.withdraw(ethers.utils.parseEther(args.amount));
    await tx.wait();
  });

async function setParameters(c: string, maxRewardRatio: number, winRatio: number, ticketPrice: string) {
  const slot = await ethers.getContractAt("Slot", c);

  console.log("Setting maxRewardRatio...");
  const tx1 = await slot.setMaxRewardRatio(maxRewardRatio);
  await tx1.wait();

  console.log("Setting winRatio...");
  const tx2 = await slot.setWinRatio(winRatio);
  await tx2.wait();

  console.log("Setting ticketPrice...");
  const tx3 = await slot.setTicketPrice(ethers.utils.parseEther(ticketPrice));
  await tx3.wait();
}

function saveFrontendFiles(c: ethers.BaseContract) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Token: c.address, "chain_id": ethers.provider.network.chainId, "network_name": ethers.provider.network.name }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync("Slot");

  fs.writeFileSync(
    path.join(contractsDir, "Slot.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );
}

// Hardhat Node and sapphire-dev test mnemonic.
const TEST_HDWALLET = {
  mnemonic: "test test test test test test test test test test test junk",
  path: "m/44'/60'/0'/0",
  initialIndex: 0,
  count: 20,
  passphrase: "",
};

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : TEST_HDWALLET;

const config: HardhatUserConfig = {
  networks: {
    hardhat: { // https://hardhat.org/metamask-issue.html
      chainId: 1337,
    },
    'sapphire': {
      url: 'https://sapphire.oasis.io',
      chainId: 0x5afe,
      accounts,
    },
    'sapphire-testnet': {
      url: 'https://testnet.sapphire.oasis.dev',
      chainId: 0x5aff,
      accounts,
    },
    'sapphire-localnet': { // docker run -it -p8545:8545 -p8546:8546 ghcr.io/oasisprotocol/sapphire-dev -test-mnemonic
      url: 'http://localhost:8545',
      chainId: 0x5afd,
      accounts,
    },
  },
  solidity: {
    version: '0.8.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  watcher: {
    compile: {
      tasks: ['compile'],
      files: ['./contracts/'],
    },
    test: {
      tasks: ['test'],
      files: ['./contracts/', './test'],
    },
    coverage: {
      tasks: ['coverage'],
      files: ['./contracts/', './test'],
    },
  },
  mocha: {
    require: ['ts-node/register/files'],
    timeout: 50_000,
  },
};

export default config;
