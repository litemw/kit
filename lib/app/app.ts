import { Container, defComp, type Component } from '@litemw/iocc';
import { createContainerHooks } from './hooks';
import { IStarter, IStopper } from './lifecycle';
import { createLogtapeLogger, ILogger, type Logger } from './logger';
import type { Module } from './module';
import { Err } from '../core/result';

export type AppInput = {
  readonly modules?: readonly Module[];
  readonly components?: readonly Component[];
  readonly logger?: Logger;
};

export class App {
  readonly container: Container;
  readonly modules: readonly Module[];
  readonly components: readonly Component[];
  readonly logger: Logger;

  constructor(input: AppInput = {}) {
    this.modules = input.modules ?? [];
    this.components = input.components ?? [];
    this.logger = input.logger ?? createLogtapeLogger();
    this.container = new Container(createContainerHooks(this.logger));

    this.container.register(
      defComp('Logger')
        .as(ILogger)
        .build(() => this.logger),
    );

    for (const module of this.modules) {
      for (const component of module.components) {
        this.container.register(component);
      }
    }

    for (const component of this.components) {
      this.container.register(component);
    }
  }

  async start(): Promise<void> {
    this.logger.debug('Starting app', {
      modules: this.modules.length,
      components: this.components.length,
    });

    const starters = await this.container.get(IStarter);

    for (const starter of starters) {
      try {
        await starter.onStart();
      } catch (err) {
        this.logger.error(Err(err), 'Starter hook failed');
        throw err;
      }
    }

    this.logger.info('App started', { starters: starters.length });
  }

  async stop(): Promise<void> {
    this.logger.debug('Stopping app');

    const stoppers = await this.container.get(IStopper);

    for (const stopper of stoppers) {
      try {
        await stopper.onStop();
      } catch (err) {
        this.logger.error(Err(err), 'Stopper hook failed');
        throw err;
      }
    }

    this.logger.info('App stopped', { stoppers: stoppers.length });
  }
}
