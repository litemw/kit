import { describe, expect, test } from 'bun:test';
import { defIntf } from '@litemw/iocc';
import { App } from '../lib/app/app';
import { ILogger } from '../lib/app/logger';
import { createTestLogger } from './test-logger';

describe('ContainerHooks', () => {
  test('logs container events', async () => {
    const { logger, records } = createTestLogger();
    const app = new App({ logger });

    await app.container.get(ILogger);

    const messages = records.map((r) => r.msg);
    expect(messages).toContain('Component registered');
    expect(messages).toContain('Factory finished');
  });

  test('logs container errors', async () => {
    const { logger, records } = createTestLogger();
    const app = new App({ logger });
    const IMissing = defIntf<string>('Missing');

    expect(() => app.container.get(IMissing)).toThrow('not registered');

    const errorRecord = records.find((r) => r.level === 'error');
    expect(errorRecord?.msg).toBe('Container error');
  });
});
