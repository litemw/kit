import { getLogger } from '@logtape/logtape';
import { Err } from '../core/result';

export type Logger = {
  debug(msg: string, kv?: Record<string, unknown>): void;
  info(msg: string, kv?: Record<string, unknown>): void;
  error(err: Err<unknown>, msg: string, kv?: Record<string, unknown>): void;
};

export function createLogtapeLogger(
  category: string | readonly string[] = 'app',
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
