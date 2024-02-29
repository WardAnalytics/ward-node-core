import {
  EthereumErc20Transaction,
  EthereumTransaction,
} from "../models/ethereum/transaction";
import {
  InexistentBlockError,
  NullResultError,
  QuicknodeRequestExecutor,
} from "./quicknodeRequestExecutor";

export class EthereumQuicknodeRequestExecutor extends QuicknodeRequestExecutor {
  isRpc = true;

  private async getBlockFromIndex(blockIndex: number): Promise<any> {
    const blockIndexHex = "0x" + blockIndex.toString(16);
    try {
      return await this.peformQuicknodeRequest("eth_getBlockByNumber", [
        blockIndexHex,
        true,
      ]);
    } catch (error) {
      if (error instanceof NullResultError) {
        throw new InexistentBlockError(blockIndex);
      }
    }
  }

  private async getLogsFromBlocks(fromBlock: number, toBlock: number) {
    const fromBlockHex = "0x" + fromBlock.toString(16);
    const toBlockHex = "0x" + toBlock.toString(16);
    const topics = [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    ];

    const logs = await this.peformQuicknodeRequest("eth_getLogs", [
      {
        fromBlock: fromBlockHex,
        toBlock: toBlockHex,
        topics: topics,
      },
    ]);

    return logs;
  }

  private async getTransfersFromBlock(
    blockIndex: number
  ): Promise<EthereumTransaction[]> {
    const block = await this.getBlockFromIndex(blockIndex);
    const blockTimestamp = parseInt(block.timestamp);

    const transactions: EthereumTransaction[] = block.transactions.map(
      (tx: any) => {
        const from = tx.from;
        const to = tx.to;
        const value = parseInt(tx.value);
        const token = "ETH"; // This method only handles standard Ethereum transactions.
        const blockNumber = parseInt(tx.blockNumber);
        const hash = tx.hash;
        const timestamp = blockTimestamp;
        return new EthereumTransaction(
          from,
          to,
          value,
          token,
          blockNumber,
          timestamp,
          hash
        );
      }
    );

    return transactions.filter(
      (transaction) => transaction.value > 0 && transaction.to !== null
    );
  }

  private async getTransfersFromBlocks(
    fromBlock: number,
    toBlock: number
  ): Promise<EthereumTransaction[]> {
    const transferPromises = [];
    for (let i = fromBlock; i <= toBlock; i++) {
      transferPromises.push(this.getTransfersFromBlock(i));
    }
    const transfers = await Promise.all(transferPromises);
    return transfers.flat();
  }

  private async getErc20TransfersFromBlocks(
    fromBlock: number,
    toBlock: number
  ): Promise<EthereumErc20Transaction[]> {
    const logs = await this.getLogsFromBlocks(fromBlock, toBlock);
    const transferLogs = logs.filter((log: any) => log.topics.length === 3); // ERC20 transfer logs have 3 topics.

    const transfers: EthereumErc20Transaction[] = transferLogs.map(
      (log: any) => {
        const from = "0x" + log.topics[1].slice(26);
        const to = "0x" + log.topics[2].slice(26);
        const value = parseInt(log.data);
        const token = log.address; // This method only handles standard ERC20 token transfers.
        const blockNumber = parseInt(log.blockNumber);
        const transactionHash = log.transactionHash;
        return new EthereumErc20Transaction(
          from,
          to,
          value,
          token,
          blockNumber,
          transactionHash
        );
      }
    );

    return transfers.filter((transfer) => transfer.value > 0);
  }

  async getTransactionsFromBlocks(
    fromBlock: number,
    toBlock: number
  ): Promise<EthereumTransaction[]> {
    const erc20TransactionsPromise = this.getErc20TransfersFromBlocks(
      fromBlock,
      toBlock
    );
    const ethTransactionsPromise = this.getTransfersFromBlocks(
      fromBlock,
      toBlock
    );

    const erc20Transactions = await erc20TransactionsPromise;
    const ethTransactions = await ethTransactionsPromise;

    const timestampPerBlock: { [blockNumber: number]: number } = {};
    ethTransactions.forEach((transaction) => {
      timestampPerBlock[transaction.blockNumber] = transaction.timestamp;
    });

    const erc20TransactionsWithTimestamps: EthereumTransaction[] =
      erc20Transactions.map((transaction) => {
        return new EthereumTransaction(
          transaction.from,
          transaction.to,
          transaction.value,
          transaction.token,
          transaction.blockNumber,
          timestampPerBlock[transaction.blockNumber],
          transaction.transactionHash
        );
      });
    return ethTransactions.concat(erc20TransactionsWithTimestamps);
  }
}
