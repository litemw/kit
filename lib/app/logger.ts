import { getLogger } from "@logtape/logtape";
import { Err } from "../core/result";

export type Logger = {
  debug(msg: string, kv?: Record<string, unknown>): void;
  info(msg: string, kv?: Record<string, unknown>): void;
  error(err: Err<unknown>, msg: string, kv?: Record<string, unknown>): void;
};

const consoleLogLevels = { debug: 0, info: 1, error: 2 } as const;

export type ConsoleLogLevel = keyof typeof consoleLogLevels;

export function createConsoleLogger(
  lowestLevel: ConsoleLogLevel = "info",
): Logger {
  const threshold = consoleLogLevels[lowestLevel];
  return {
    debug(msg, kv) {
      if (threshold <= consoleLogLevels.debug) {
        console.debug(`[debug] ${interpolate(msg, kv)}`);
      }
    },
    info(msg, kv) {
      if (threshold <= consoleLogLevels.info) {
        console.info(`[info] ${interpolate(msg, kv)}`);
      }
    },
    error(err, msg, kv) {
      console.error(`[error] ${interpolate(msg, kv)}`, err.error);
    },
  };
}

function interpolate(msg: string, kv?: Record<string, unknown>): string {
  return msg.replace(/\{(\w+)\}/g, (match, key: string) =>
    kv && key in kv ? String(kv[key]) : match,
  );
}

export function createLogtapeLogger(
  category: string | readonly string[] = "app",
): Logger {
  const logger = getLogger(category);

  return {
    debug(msg, kv) {
      logger.debug(msg, kv ?? {});
    },
    info(msg, kv) {
      logger.info(msg, kv ?? {});
    },
    error(err, msg, kv) {
      logger.error(msg, { ...kv, error: err });
    },
  };
}
