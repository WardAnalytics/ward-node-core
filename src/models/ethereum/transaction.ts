import { Transaction } from "../interfaces/transaction";

export class EthereumErc20Transaction {
  from: string;
  to: string;
  value: number;
  token: string;
  blockNumber: number;
  transactionHash: string;

  constructor(
    from: string,
    to: string,
    value: number,
    token: string,
    blockNumber: number,
    transactionHash: string
  ) {
    this.from = from;
    this.to = to;
    this.value = value;

    this.token = token;

    this.blockNumber = blockNumber;
    this.transactionHash = transactionHash;
  }
}

export class EthereumTransaction
  extends EthereumErc20Transaction
  implements Transaction
{
  timestamp: number;

  constructor(
    from: string,
    to: string,
    value: number,
    token: string,
    blockNumber: number,
    timestamp: number,
    transactionHash: string
  ) {
    super(from, to, value, token, blockNumber, transactionHash);
    this.timestamp = timestamp;
  }

  toJSON() {
    return {
      from: this.from,
      to: this.to,
      value: this.value,
      token: this.token,
      block_number: this.blockNumber,
      timestamp: this.timestamp,
      transaction_hash: this.transactionHash,
    };
  }

  static fromJSON(json: any) {
    const transaction = new EthereumTransaction(
      json.from,
      json.to,
      json.value,
      json.token,
      json.block_number,
      json.timestamp,
      json.transaction_hash
    );
    return transaction;
  }
}
