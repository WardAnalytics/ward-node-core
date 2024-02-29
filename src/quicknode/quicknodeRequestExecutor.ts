import { BatchSizeManager } from "../utils/batchSizeManager";
import { LoadBalancer } from "../utils/loadBalancer";

export class InexistentBlockError extends Error {
  constructor(blockNumber: number) {
    super(`Block ${blockNumber} does not exist`);
    this.name = "InexistentBlockError";
  }
}
export class NullResultError extends Error {
  constructor() {
    super("Null result error");
    this.name = "NullResultError";
  }
}

export abstract class QuicknodeRequestExecutor {
  loadBalancer: LoadBalancer;
  batchSizeManager: BatchSizeManager;
  protected abstract isRpc: boolean;

  constructor(endpoints: string[], batchSizeManager: BatchSizeManager) {
    this.loadBalancer = new LoadBalancer(endpoints);
    this.batchSizeManager = batchSizeManager;
  }

  async peformQuicknodeRequest(method: string, params: any[]) {
    while (true) {
      try {
        const response = await this.loadBalancer.performRequest(
          method,
          params,
          this.isRpc
        );

        console.log("Response:", response);

        const error = response["error"];
        if (error) {
          throw new Error(error);
        }

        const result = response["result"];

        if (result === null) {
          throw new NullResultError();
        }

        if (this.batchSizeManager) {
          this.batchSizeManager.registerSuccessfulRequest();
        }

        return result;
      } catch (error) {
        if (error instanceof NullResultError) {
          throw error;
        }

        console.log("Throtled. Retrying request in 1 second...");

        if (this.batchSizeManager) {
          this.batchSizeManager.registerThrottledRequest();
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

