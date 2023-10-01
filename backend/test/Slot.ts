import { expect } from "chai";
import { ethers } from "hardhat";
import {BigNumber, BytesLike, Contract} from "ethers";

import { Slot } from "../typechain-types/contracts/Slot";

describe("Slot", function () {
  async function deploySlot() {
    const Slot_factory = await ethers.getContractFactory("Slot");
    const slot = await Slot_factory.deploy();
    await slot.deployed();
    return { slot };
  }

  it("Should draw, if enabled", async function () {
    const { slot } = await deploySlot();
    await slot.setTicketPrice(ethers.utils.parseEther("1.0"));

    const tx = await slot.draw({value: ethers.utils.parseEther("1.0")});
    //await expect(tx).to.be.revertedWith('NotEnabled'); // TODO

    await slot.setEnabled(true);

    const tx2 = await slot.draw({value: ethers.utils.parseEther("1.0")});
    await expect(tx2).to.be.ok;
  });

  it("Should draw, if correct ticket price only", async function () {
    const { slot } = await deploySlot();
    await slot.setEnabled(true);

    const tx = await slot.draw({value: ethers.utils.parseEther("1.0")});
    //await expect(tx).to.be.revertedWith('PriceNotSet'); // TODO

    await slot.setTicketPrice(ethers.utils.parseEther("100"));

    const tx2 = await slot.draw({value: ethers.utils.parseEther("1.0")});
    // await expect(tx2).to.be.revertedWith('InvalidAmount'); // TODO

    const tx3 = await slot.draw({value: ethers.utils.parseEther("100")});
    await expect(tx3).to.be.ok;
  });

  it("Should win", async function () {
    const { slot } = await deploySlot();
    await slot.setTicketPrice(ethers.utils.parseEther("1.0"));
    await slot.setEnabled(true);
    // Fund the pool.
    const tx = {
      from: (await ethers.getSigner(0)).address,
      to: slot.address,
      value: ethers.utils.parseEther("10.0"),
      nonce: (await ethers.getSigner(0)).getTransactionCount(),
      gasLimit: ethers.utils.hexlify(100_000), // 100000
      gasPrice: 100_000_000_000,
    }
    await (await ethers.getSigner(0)).sendTransaction(tx);

    const tx = await slot.setWinRatio(255);

    const origBalance = await (await ethers.getSigner(0)).getBalance();
    // Also check the payout.
    slot.on({
      address: slot.address,
      topics: [
        slot.interface.getEventTopic("Win"),
        null,
        ethers.utils.hexZeroPad((await ethers.getSigner(0)).address, 32),
      ],
    }, async (_) => {
      expect(origBalance < await (await ethers.getSigner(0)).getBalance()).to.be.true;
    });
    slot.on({
      address: slot.address,
      topics: [
        slot.interface.getEventTopic("Lose"),
        null,
        ethers.utils.hexZeroPad((await ethers.getSigner(0)).address, 32),
      ],
    }, async (_) => {
      expect(false).to.be.true;
    });

    const tx2 = await slot.draw({value: ethers.utils.parseEther("1.0"), gasLimit: ethers.utils.hexlify(1000_000)});
    const receipt = await tx2.wait()
  });

  it("Should lose", async function () {
    const { slot } = await deploySlot();
    await slot.setTicketPrice(ethers.utils.parseEther("1.0"));
    await slot.setEnabled(true);
    // Fund the pool.
    const tx = {
      from: (await ethers.getSigner(0)).address,
      to: slot.address,
      value: ethers.utils.parseEther("10.0"),
      nonce: (await ethers.getSigner(0)).getTransactionCount(),
      gasLimit: ethers.utils.hexlify(100_000), // 100000
      gasPrice: 100_000_000_000,
    }
    await (await ethers.getSigner(0)).sendTransaction(tx);

    await slot.setWinRatio(0);

    const origBalance = await (await ethers.getSigner(0)).getBalance();
    // Also check the payout.
    slot.on({
      address: slot.address,
      topics: [
        slot.interface.getEventTopic("Lose"),
        null,
        ethers.utils.hexZeroPad((await ethers.getSigner(0)).address, 32),
      ],
    }, async (_) => {
      expect(origBalance > await (await ethers.getSigner(0)).getBalance()).to.be.true;
    });
    slot.on({
      address: slot.address,
      topics: [
        slot.interface.getEventTopic("Win"),
        null,
        ethers.utils.hexZeroPad((await ethers.getSigner(0)).address, 32),
      ],
    }, async (_) => {
      expect(origBalance < await (await ethers.getSigner(0)).getBalance()).to.be.true;
    });
    const tx2 = await slot.draw({value: ethers.utils.parseEther("1.0"), gasLimit: ethers.utils.hexlify(500_000) });
    const receipt = await tx2.wait()
  });

  it("Should withdraw", async function () {
    const { slot } = await deploySlot();
    // Fund the pool.
    const tx = {
      from: (await ethers.getSigner(0)).address,
      to: slot.address,
      value: ethers.utils.parseEther("10.0"),
      nonce: (await ethers.getSigner(0)).getTransactionCount(),
      gasLimit: ethers.utils.hexlify(100_000), // 100000
      gasPrice: 100_000_000_000,
    }
    await (await ethers.getSigner(0)).sendTransaction(tx);

    const balance = await (await ethers.getSigner(0)).getBalance();
    const tx2 = await slot.withdraw(ethers.utils.parseEther("10.0"));
    await tx2.wait();
    expect(balance < await (await ethers.getSigner(0)).getBalance()).to.be.true;
  });
});
