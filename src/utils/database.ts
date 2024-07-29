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

    const maxBlock = await conn
      .query<number>("SELECT MAX(block) FROM blocks")
      .one();
    return maxBlock;
  }

  async getOldestBlockNumber(): Promise<number | null> {
    const conn = await this.getConn();

    const minBlock = await conn
      .query<number>("SELECT MIN(block) FROM blocks")
      .one();
    return minBlock;
  }
}
