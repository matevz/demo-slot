# Wheel of Fortune (aka the slot machine)

![Wheel of Fortune screenshot](screenshot.png)

This is a simple SmartCon 2023 hackathon project exposing awesome on-chain
encryption provided by Oasis Sapphire.

NOTE: The demo version of this dApp is deployed at [github pages]. If you don't
have TEST tokens, get it on the [Oasis Testnet Faucet] page.

[github pages]: https://matevz.github.io/demo-slot
[Oasis Testnet Faucet]: https://faucet.testnet.oasis.dev/

## Main flow

1. dApp developer deploys the contract and pre-funds it.
2. User decides to buy a "lottery" ticket at predefined price.
3. Calls the draw() on-chain function and pays for it.
4. The on-chain RNG computes whether the user won or lost based on the
   (confidential) win ratio.
5. If they lost, then the payed amount is added to the (public) fortune wheel
   reward pool.
6. If they won, then a payout is made back to the user from a predefined share
   of the reward pool.

## Compilation

This monorepo is set up for `pnpm`. Install dependencies by running:

```sh
pnpm install
```

### Backend

Move to the `backend` folder and build smart contracts:

```sh
pnpm build
```

Next, to deploy the contract to Sapphire Testnet, run:

```sh
PRIVATE_KEY=<your_private_key> npx hardhat deploy <reward_ratio> <win_ratio> <ticket_price> --network sapphire-testnet
```

And replace the following:
- your_private_key: hex-encoded private key of the deployer account starting
  with 0x
- reward_ratio: the amount of the reward pool to hand out in case of winning
  in 1/256ths. For example, 25% of the pool equals 64.
- win_ratio: the probability of winning on each draw in 1/256ths. For example
  1% roughly equals 3.
- ticket_price: the price of a single ticket in native tokens. 1 equals 1 TEST.

You can also change the above settings by calling `npx hardhat setParameters`
task. You can also call `npx hardhat deposit` and `npx hardhat withdraw` tasks
for funding or withdrawing from the reward pool.

Once you set the parameters, you **need to enable the contract** by running
`npx hardhat enable <contract_address>`. If you need to disable the contract
(the kill switch), you can do this anytime by running `npx hardhat disable
<contract_address>`.

### Frontend

You can run the frontend locally by running:

```shell
pnpm start
```

and then visiting https://localhost:3000.

To build assets for deployment run:

```sh
pnpm build
```

`build` folder will contain the generated HTML artifacts.

## Disclaimer

This is a demonstration project focused on the confidentiality features of the
Oasis Network. The smart contract, backend and frontend code is not audited
neither can authors of this project be held responsible for any security
vulnerabilities, financial and/or data loss or theft.

This project is not affiliated with the Oasis Foundation or Oasis Labs Inc.
