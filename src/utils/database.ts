import sqlite3 from "sqlite3";

interface MaxBlocksRow {
  "MAX(block)": number | null;
}

interface MinBlocksRow {
  "MIN(block)": number | null;
}

export class UploadingRepository {
  dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async getConn(): Promise<sqlite3.Database> {
    return new sqlite3.Database(this.dbPath);
  }

  async getLatestBlockNumber(): Promise<number | null> {
    const conn = await this.getConn();
    return new Promise((resolve, reject) => {
      conn.get("SELECT MAX(block) FROM blocks", (err, row: MaxBlocksRow) => {
        if (err) {
          reject(err);
        } else {
          resolve(row["MAX(block)"]);
        }
      });
    });
  }

  async getOldestBlockNumber(): Promise<number | null> {
    const conn = await this.getConn();
    return new Promise((resolve, reject) => {
      conn.get("SELECT MIN(block) FROM blocks", (err, row: MinBlocksRow) => {
        if (err) {
          reject(err);
        } else {
          resolve(row["MIN(block)"]);
        }
      });
    });
  }
}
