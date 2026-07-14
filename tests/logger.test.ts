import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { configure, reset, type LogRecord } from '@logtape/logtape';
import { createLogtapeLogger } from '../lib/app/logger';
import { Err } from '../lib/core/result';

describe('LogtapeLogger', () => {
  const records: LogRecord[] = [];

  beforeAll(async () => {
    await configure({
      sinks: {
        test(record) {
          records.push(record);
        },
      },
      loggers: [
        { category: 'app', sinks: ['test'], lowestLevel: 'debug' },
        { category: ['logtape', 'meta'], sinks: [] },
      ],
    });
  });

  afterAll(async () => {
    await reset();
  });

  test('forwards debug, info, and error to logtape', () => {
    const logger = createLogtapeLogger();
    const failure = new Error('boom');

    logger.debug('debug message');
    logger.info('info message', { key: 'value' });
    logger.error(Err(failure), 'error message', { key: 'value' });

    expect(records.map((r) => [r.level, r.rawMessage])).toEqual([
      ['debug', 'debug message'],
      ['info', 'info message'],
      ['error', 'error message'],
    ]);
    expect(records[1]?.properties).toEqual({ key: 'value' });
    expect(records[2]?.properties).toEqual({
      key: 'value',
      error: Err(failure),
    });
  });
});
