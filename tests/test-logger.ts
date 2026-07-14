import type { Logger } from "../lib/app/logger";

export type LogRecord = {
  readonly level: "debug" | "info" | "error";
  readonly msg: string;
  readonly err?: unknown;
};

export function createTestLogger() {
  const records: LogRecord[] = [];
  const logger: Logger = {
    debug(msg) {
      records.push({ level: "debug", msg });
    },
    info(msg) {
      records.push({ level: "info", msg });
    },
    error(err, msg) {
      records.push({ level: "error", msg, err });
    },
  };
  return { logger, records };
}
