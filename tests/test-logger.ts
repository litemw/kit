import type { Logger } from "../lib/app/logger";

export type LogRecord = {
  readonly level: "debug" | "info" | "error";
  readonly msg: string;
  readonly kv?: Record<string, unknown>;
  readonly err?: unknown;
};

export function createTestLogger() {
  const records: LogRecord[] = [];
  const logger: Logger = {
    debug(msg, kv) {
      records.push({ level: "debug", msg, kv });
    },
    info(msg, kv) {
      records.push({ level: "info", msg, kv });
    },
    error(err, msg, kv) {
      records.push({ level: "error", msg, kv, err });
    },
  };
  return { logger, records };
}
