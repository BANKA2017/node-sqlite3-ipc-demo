export const Time2SnowFlake = (
  date = Date.now(),
  datacenter_id = 0,
  server_id = 0,
  sequence_id = 0,
  start = 1288834974657,
) => {
  const diffDate =
    (typeof date === "number" || typeof date === "bigint"
      ? date
      : Date.parse(date)) - start;
  if (diffDate < 0) {
    return BigInt(0);
  }
  return (
    (BigInt(diffDate) << BigInt(22)) |
    BigInt((datacenter_id << 17) | (server_id << 12) | sequence_id)
  );
};
export const SnowFlake2Time = (snowflake, start = 1288834974657) => {
  return Math.floor(Number(snowflake || 0) / 4194304) + start;
};
