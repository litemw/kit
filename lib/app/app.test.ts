import { describe, expect, test } from 'bun:test';
import { defineComponent } from '@litemw/iocc';
import { createApp, createModule } from './app';
import { IStarter, IStopper } from './hooks';

describe('App', () => {
  test('registers module components and runs lifecycle hooks', async () => {
    const calls: string[] = [];
    const lifecycleComponent = defineComponent('lifecycle')
      .as(IStarter)
      .as(IStopper)(() => ({
        onStart: () => {
          calls.push('start');
        },
        onStop: () => {
          calls.push('stop');
        },
      }));

    const app = createApp({
      modules: [createModule(lifecycleComponent)],
    });

    await app.start();
    await app.stop();

    expect(calls).toEqual(['start', 'stop']);
  });
});
