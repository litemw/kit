import { describe, expect, test } from 'bun:test';
import { defComp } from '@litemw/iocc';
import { App } from '../lib/app/app';
import { createModule } from '../lib/app/module';
import { IStarter, IStopper } from '../lib/app/lifecycle';
import { ILogger } from '../lib/app/logger';
import { Err } from '../lib/core/result';
import { createTestLogger } from './test-logger';

describe('App', () => {
  test('registers module components and runs lifecycle hooks', async () => {
    const calls: string[] = [];
    const lifecycleComponent = defComp('lifecycle')
      .as(IStarter)
      .as(IStopper)
      .build(() => ({
        onStart: () => {
          calls.push('start');
        },
        onStop: () => {
          calls.push('stop');
        },
      }));

    const app = new App({
      modules: [createModule(lifecycleComponent)],
    });

    await app.start();
    await app.stop();

    expect(calls).toEqual(['start', 'stop']);
  });

  test('uses provided logger and logs lifecycle', async () => {
    const { logger, records } = createTestLogger();
    const app = new App({ logger });

    await app.start();
    await app.stop();

    expect(app.logger).toBe(logger);
    const infoMessages = records
      .filter((r) => r.level === 'info')
      .map((r) => r.msg);
    expect(infoMessages).toContain('App started');
    expect(infoMessages).toContain('App stopped');
  });

  test('registers logger in the container', async () => {
    const { logger } = createTestLogger();
    const app = new App({ logger });

    expect(await app.container.get(ILogger)).toBe(logger);
  });

  test('logs and rethrows hook errors', async () => {
    const { logger, records } = createTestLogger();
    const failure = new Error('boom');
    const failingStarter = defComp('failing')
      .as(IStarter)
      .build(() => ({
        onStart: () => {
          throw failure;
        },
      }));

    const app = new App({ components: [failingStarter], logger });

    await expect(app.start()).rejects.toThrow('boom');
    const errorRecord = records.find((r) => r.level === 'error');
    expect(errorRecord?.msg).toBe('Starter hook failed');
    expect(errorRecord?.err).toEqual(Err(failure));
  });
});
