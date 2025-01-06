import { createConnection } from "node:net";
import {
  PackageSocketData,
  SocketDataStream,
  SocketResponse,
} from "./socket.mjs";
import { SnowFlake2Time, Time2SnowFlake } from "./snowflake.mjs";
import EventEmitter from "node:events";
import log from "./console.mjs";

export class SQLiteClient {
  client;
  emitter = new EventEmitter();
  retry = 5;
  timeout = 10000;
  stream = new SocketDataStream();

  constructor(path = "", timeout = 10000) {
    if (!path) {
      throw Error("Init failed");
    }
    if (timeout > 0) {
      this.timeout = timeout;
    }
    this.initClient(path);
  }

  initClient(path = "") {
    this.client = createConnection(path);
    this.client.on("data", (data) => {
      this.stream.push(data);
      while (this.stream.globalBufferLength >= 4) {
        if (this.stream.hasPackage) {
          const socketPackage = this.stream.package;
          const responseObject = JSON.parse(socketPackage.toString());
          this.emitter.emit("data:" + responseObject.id, {
            ...responseObject,
            cost: Date.now() - SnowFlake2Time(responseObject.id),
          });
        }
      }
    });

    this.client.on("connect", () => {
      // reset retry times
      log.info("", "sql_client: connected");
      this.retry = 5;
    });
    this.client.on("end", () => {
      log.info("", "sql_client: reconnect in 10s...", this.retry + "/5");
      if (this.retry > 0) {
        this.retry--;
        setTimeout(() => {
          this.initClient(path);
        }, 10 * 1000);
      } else {
        throw Error("Unable to connect the db gateway");
      }
    });
    this.client.on("error", (event) => {
      log.error("", event);
      log.info("", "sql_client: reconnect in 10s...", this.retry + "/5");
      if (this.retry > 0) {
        this.retry--;
        setTimeout(() => {
          this.initClient(path);
        }, 10 * 1000);
      } else {
        throw Error("Unable to connect the db gateway");
      }
    });
  }

  // ext: exec -> for transaction
  async query(sql, params, type = "exec", ext = {}) {
    const queryID = Time2SnowFlake(
      Date.now(),
      Math.floor(10 * Math.random()),
      Math.floor(10 * Math.random()),
      Math.floor(100 * Math.random()),
    ).toString();
    const queryObject = { sql, params, type, id: queryID, ext };
    // log.log(queryObject)
    this.client.write(PackageSocketData(queryObject));
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(
          SocketResponse(queryID, false, {
            name: "timeout",
            message: "timeout",
          }),
        );
      }, this.timeout);
      this.emitter.on("data:" + queryID, (data) => {
        clearTimeout(timeoutHandle);
        resolve(data);
      });
    });
  }

  get state() {
    return this.client.readyState;
  }
}
