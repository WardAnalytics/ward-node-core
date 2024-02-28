export class BatchSizeManager {
  batchSize: number;
  requestsBeforeAdjustment: number;
  successfulRequestsSinceAdjustment: number;
  failedRequestsSinceAdjustment: number;
  requestsSinceAdjustment: number;

  constructor(initialBatchSize: number) {
    this.batchSize = initialBatchSize;
    this.requestsBeforeAdjustment = 20;
    this.successfulRequestsSinceAdjustment = 0;
    this.failedRequestsSinceAdjustment = 0;
    this.requestsSinceAdjustment = 0;
  }

  getBatchSize(): number {
    return this.batchSize;
  }

  registerThrottledRequest() {
    this.failedRequestsSinceAdjustment++;
    this.requestsSinceAdjustment++;
    if (this.requestsSinceAdjustment >= this.requestsBeforeAdjustment) {
      this.adjustBatchSize();
    }
  }

  registerSuccessfulRequest() {
    this.successfulRequestsSinceAdjustment++;
    this.requestsSinceAdjustment++;
    if (this.requestsSinceAdjustment >= this.requestsBeforeAdjustment) {
      this.adjustBatchSize();
    }
  }

  adjustBatchSize() {
    var newBatchSize: number;

    const errorRate =
      this.failedRequestsSinceAdjustment / this.requestsSinceAdjustment;
    if (errorRate > 0.025) {
      newBatchSize = Math.floor(this.batchSize / 2);
    } else if (errorRate < 0.005) {
      newBatchSize = this.batchSize * 2;
    } else {
      newBatchSize = this.batchSize;
    }

    console.log(
      `Adjusting batch size from ${this.batchSize} to ${newBatchSize}...`
    );

    this.batchSize = newBatchSize;

    this.successfulRequestsSinceAdjustment = 0;
    this.failedRequestsSinceAdjustment = 0;
    this.requestsSinceAdjustment = 0;

    this.requestsBeforeAdjustment = Math.min(
      1000,
      Math.floor(this.requestsBeforeAdjustment * 1.5)
    );
  }
}
