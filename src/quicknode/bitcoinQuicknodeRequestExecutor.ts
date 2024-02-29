import * as bitcoin from "bitcoinjs-lib";
import {
  BitcoinTransaction,
  BitcoinTransactionInput,
  BitcoinTransactionOutput,
} from "../models/bitcoin/transaction";
import {
  InexistentBlockError,
  NullResultError,
  QuicknodeRequestExecutor,
} from "./quicknodeRequestExecutor";

const dataTransaction = "nulldata";

export class BitcoinQuicknodeRequestExecutor extends QuicknodeRequestExecutor {
  isRpc: boolean = false;

  private async getBlockFromHash(blockHash: string): Promise<string> {
    const response = await this.peformQuicknodeRequest("getblock", [
      blockHash,
      0,
    ]);
    return response;
  }

  private async getBlockFromIndex(blockIndex: number): Promise<string> {
    const blockHash = await this.getBlockHash(blockIndex);
    return await this.getBlockFromHash(blockHash);
  }

  private async getBlockHash(blockNumber: number): Promise<string> {
    const response = await this.peformQuicknodeRequest("getblockhash", [
      blockNumber,
    ]).catch((error) => {
      if (error instanceof NullResultError) {
        throw new InexistentBlockError(blockNumber);
      }
    });
    return response;
  }

  private async getTransactionsFromBlock(blockIndex: number) {
    const blockHex = await this.getBlockFromIndex(blockIndex);
    const block = bitcoin.Block.fromHex(blockHex);

    if (typeof block.transactions === "undefined") {
      return [];
    }

    return block.transactions.map((tx) => {
      const txid = tx.getId();

      const inputs = tx.ins.map((input, index) => {
        if (
          input.hash.toString("hex") ===
          "0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          return new BitcoinTransactionInput("coinbase", 0, index);
        }
        return new BitcoinTransactionInput(
          input.hash.reverse().toString("hex"),
          input.index,
          index
        );
      });

      const outputs = tx.outs.map((output, index) => {
        try {
          const address = bitcoin.address.fromOutputScript(output.script); // Handle standard transaction types.
          return new BitcoinTransactionOutput(address, output.value, index);
        } catch (e) {
          const asmScript = bitcoin.script.toASM(output.script);

          if (asmScript.startsWith("OP_RETURN")) {
            return dataTransaction; // Handle data transactions, wich have no monetary value.
          }

          const asmScriptParts = asmScript.split(" ");

          if (
            asmScriptParts.length === 2 &&
            asmScriptParts[0].length === 130 &&
            asmScriptParts[1] === "OP_CHECKSIG"
          ) {
            const pubkey = asmScriptParts[0];

            const pubkeyBuffer = Buffer.from(pubkey, "hex");

            const address = bitcoin.payments.p2pkh({
              pubkey: pubkeyBuffer,
            }).address; // Handle P2PK transactions. Note that technically a P2PK transaction has no address, but it is common practice for block explorers to display the address inferred from the public key.

            if (typeof address === "string") {
              return new BitcoinTransactionOutput(address, output.value, index);
            }
          }
          return new BitcoinTransactionOutput("Unknown", output.value, index); // Handle unknown transaction types.
        }
      });

      const validOutputs: BitcoinTransactionOutput[] = [];

      outputs.forEach((output) => {
        if (output !== dataTransaction) {
          validOutputs.push(output);
        }
      });

      return new BitcoinTransaction(
        txid,
        inputs,
        validOutputs,
        blockIndex,
        block.getId(),
        block.timestamp
      );
    });
  }

  async getTransactionsFromBlocks(
    fromBlockIndex: number,
    toBlockIndex: number
  ) {
    const promises = [];

    // Execute getTransactionsFromBlock for each block index at the same time
    for (let i = fromBlockIndex; i <= toBlockIndex; i++) {
      promises.push(this.getTransactionsFromBlock(i));
    }

    // Wait for all promises to resolve
    const blocks = await Promise.all(promises);

    // Flatten the array of arrays into a single array
    return blocks.flat();
  }
}
