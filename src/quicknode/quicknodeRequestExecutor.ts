import { BatchSizeManager } from "../utils/batchSizeManager";
import { LoadBalancer } from "../utils/loadBalancer";


export class QuicknodeRequestExecutor {
  loadBalancer: LoadBalancer;
  batchSizeManager: BatchSizeManager;

  constructor(endpoints: string[], batchSizeManager: BatchSizeManager) {
    this.loadBalancer = new LoadBalancer(endpoints);
    this.batchSizeManager = batchSizeManager;
  }

  async peformQuicknodeRequest(method: string, params: (string|number)[]) {
    while (true) {
      try {
        const response = await this.loadBalancer.performRequest(method, params);
        const result = response["result"];

        if (this.batchSizeManager) {
          this.batchSizeManager.registerSuccessfulRequest();
        }

        return result;
      } catch (error) {
        console.log("Throtled. Retrying request in 1 second...");

        if (this.batchSizeManager) {
          this.batchSizeManager.registerThrottledRequest();
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

