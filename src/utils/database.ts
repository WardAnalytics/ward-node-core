import { parse } from "pg-connection-string";
import { connect } from "ts-postgres";

export class UploadingRepository {
  dbPath: string;
  connParams: any;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.connParams = parse(dbPath);
  }

  async getConn() {
    return await connect({
      host: this.connParams.host,
      port: this.connParams.port,
      user: this.connParams.user,
      password: this.connParams.password,
      database: this.connParams.database,
    });
  }

  async getLatestBlockNumber() {
    const conn = await this.getConn();

    const maxBlockResult = await conn.query<number>(
      "SELECT MAX(block) FROM blocks"
    );

    if (maxBlockResult.rows.length === 0) {
      return null;
    }

    return maxBlockResult.rows[0][0];

  }

  async getOldestBlockNumber(): Promise<number | null> {
    const conn = await this.getConn();

    const minBlockResult = await conn.query<number>(
      "SELECT MIN(block) FROM blocks"
    );

    if (minBlockResult.rows.length === 0) {
      return null;
    }

    return minBlockResult.rows[0][0];
  }
}
