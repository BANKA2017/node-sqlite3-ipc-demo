import { createServer } from "node:net";
import sqlite3_ from "sqlite3";
import {
  PackageSocketData,
  SocketDataStream,
  SocketResponse,
} from "./socket.mjs";
import log from "./console.mjs";

export class SQLiteServer {
  DBctx;
  SocketPath;
  Server;
  constructor(dbpath = "", socketPath = "") {
    if (!dbpath || !socketPath) {
      throw Error("Init failed");
    }
    const sqlite3 = sqlite3_.verbose();
    this.SocketPath = socketPath;
    this.DBctx = new sqlite3.Database(dbpath);
    this.Server = createServer((socket) => {
      log.success("connected!");

      const stream = new SocketDataStream();

      socket.on("data", (data) => {
        stream.push(data);
        while (stream.globalBufferLength >= 4) {
          if (stream.hasPackage) {
            const socketPackage = stream.package;

            const queryObject = JSON.parse(socketPackage.toString());
            console.log(queryObject);
            // sql, params, type, id
            switch (queryObject.type) {
              case "run":
                this.DBctx.run(queryObject.sql, queryObject.params, (err) => {
                  if (err) {
                    socket.write(
                      PackageSocketData(
                        SocketResponse(queryObject.id, false, {
                          name: err.name,
                          message: err.message,
                        }),
                      ),
                    );
                  } else {
                    socket.write(
                      PackageSocketData(SocketResponse(queryObject.id, true)),
                    );
                  }
                });
                break;
              case "exec":
                this.DBctx.exec(
                  queryObject.ext?.transaction
                    ? "BEGIN TRANSACTION;" + queryObject.sql + ";COMMIT;"
                    : queryObject.sql,
                  (err) => {
                    if (err) {
                      socket.write(
                        PackageSocketData(
                          SocketResponse(queryObject.id, false, {
                            name: err.name,
                            message: err.message,
                          }),
                        ),
                      );
                    } else {
                      socket.write(
                        PackageSocketData(SocketResponse(queryObject.id, true)),
                      );
                    }
                  },
                );
                break;
              case "get":
              case "all":
                this.DBctx[queryObject.type](
                  queryObject.sql,
                  queryObject.params,
                  (err, data) => {
                    if (err) {
                      socket.write(
                        PackageSocketData(
                          SocketResponse(
                            queryObject.id,
                            false,
                            { name: err.name, message: err.message },
                            data,
                          ),
                        ),
                      );
                    } else {
                      socket.write(
                        PackageSocketData(
                          SocketResponse(queryObject.id, true, {}, data),
                        ),
                      );
                    }
                  },
                );
                break;
              default:
                socket.write(
                  PackageSocketData(
                    SocketResponse(queryObject.id, false, "Invalid query type"),
                  ),
                );
            }
          } else {
            // waiting...
            break;
          }
        }
      });

      socket.on("end", () => {
        this.exitDB();
        log.success("disconnected!");
      });

      socket.on("error", (err) => {
        log.error(err);
      });
    });
    this.Server.listen(this.SocketPath, () => {
      log.info("listen: " + this.SocketPath);
    });
  }
  exitDB() {
    //writeDB.run('vacuum;')
    this.Server.close();
    this.DBctx.close();
  }
}

// process.on('exit', exitDB)
//
// process.on('SIGINT', () => {
//     log.warn('SIGINT!')
//     server.close()
//     exitDB()
//     process.exit()
// })
