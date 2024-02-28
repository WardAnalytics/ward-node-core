export class TransactionInput {
    txid: string;
    vout: number;
    n: number;

  constructor(txid: string, vout: number, n: number) {
    this.txid = txid;
    this.vout = vout;
    this.n = n;
  }

  toJSON() {
    return {
      txid: this.txid,
      vout: this.vout,
      n: this.n,
    };
  }

  static fromJSON(json: any) {
    const transactionInput = new TransactionInput(json.txid, json.vout, json.n);
    return transactionInput;
  }
}

export class TransactionOutput {
    address: string;
    value: number;
    n: number;

  constructor(address: string, value: number, n: number) {
    this.address = address;
    this.value = value;
    this.n = n;
  }

  toJSON() {
    return {
      address: this.address,
      value: this.value,
      n: this.n,
    };
  }

  static fromJSON(json: any) {
    const transactionOutput = new TransactionOutput(json.address, json.value, json.n);
    return transactionOutput;
  }
}


export class Transaction {
    txid: string;
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
    blockNumber: number;
    blockHash: string;
    timestamp: number;

  constructor(txid: string, inputs: TransactionInput[], outputs: TransactionOutput[], blockNumber: number, blockHash: string, timestamp: number) {
    this.txid = txid;
    this.inputs = inputs;
    this.outputs = outputs;
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.timestamp = timestamp;
  }

  toJSON() {
    return {
      txid: this.txid,
      inputs: this.inputs.map((input) => input.toJSON()),
      outputs: this.outputs.map((output) => output.toJSON()),
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      timestamp: this.timestamp,
    };
  }

  static fromJSON(json: any) {
    return new Transaction(
      json.txid,
      json.inputs.map((input: any) => TransactionInput.fromJSON(input)),
      json.outputs.map((output: any) => TransactionOutput.fromJSON(output)),
      json.blockNumber,
      json.blockHash,
      json.timestamp
    );
  }
}


