import { createClient, RedisClientType } from "redis";
import { Transaction } from "../models/interfaces/transaction";

export abstract class TransactionQueue<T extends Transaction> {
  client: RedisClientType;
  maxQueueLength: number;

  constructor(
    redisHost: string,
    redisPort: string,
    redisDb: string,
    maxQueueLength = 100000
  ) {
    this.client = createClient({
      url: `redis://${redisHost}:${redisPort}/${redisDb}`,
    });
    this.maxQueueLength = maxQueueLength;
  }

  async ready() {
    await this.client.connect();
  }

  async getQueueLength(): Promise<number> {
    return await this.client.lLen("transactions");
  }

  abstract getMaxBlock(): Promise<number | null>;

  async enqueueTransactions(transactions: T[]): Promise<void> {
    const queueSize = await this.getQueueLength();

    while (queueSize + transactions.length > this.maxQueueLength) {
      console.log(
        `Attempted to enqueue ${transactions.length} transactions, but queue is full. Waiting 1 second...`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const serializedTransactions = transactions.map((tx) => tx.toJSON());
    const stringfiedTransactions = serializedTransactions.map((tx) =>
      JSON.stringify(tx)
    );

    const promises = [];

    for (const tx of stringfiedTransactions) {
      promises.push(this.client.rPush("transactions", tx));
    }

    await Promise.all(promises);
  }
}
