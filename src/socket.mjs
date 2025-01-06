export class SocketDataStream {
  globalBuffer = Buffer.alloc(0);

  get currentBufferLength() {
    return this.globalBuffer.readUInt32BE(0);
  }
  get globalBufferLength() {
    return this.globalBuffer.byteLength;
  }
  get hasPackage() {
    return this.globalBufferLength >= 4 + this.currentBufferLength;
  }
  get package() {
    const length = this.currentBufferLength;
    const subBuffer = this.globalBuffer.subarray(4, 4 + length);
    this.globalBuffer = this.globalBuffer.subarray(4 + length);
    return subBuffer;
  }
  push(buffer) {
    this.globalBuffer = Buffer.concat([this.globalBuffer, buffer]);
  }
}

export const PackageSocketData = (data = {}) => {
  const queryObject = JSON.stringify(data);
  const length = Buffer.byteLength(queryObject);
  const buffer = Buffer.alloc(4 + length);

  buffer.writeUInt32BE(length, 0);

  buffer.write(queryObject, 4);
  return buffer;
};

export const SocketResponse = (
  id = 0,
  success = false,
  message = {},
  data = [],
) => ({
  id,
  success,
  message,
  data,
});
