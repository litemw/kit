import { Container, defineInterface, type Component } from '@litemw/iocc';

export type Starter = {
  onStart(): void | Promise<void>;
};

export type Stopper = {
  onStop(): void | Promise<void>;
};

export const IStarter = defineInterface<Starter>('Starter').multi;
export const IStopper = defineInterface<Stopper>('Stopper').multi;

export type Module = {
  readonly components: readonly Component[];
};

export function createModule(...components: readonly Component[]): Module {
  return { components };
}

export type App = {
  readonly container: Container;
  readonly modules: readonly Module[];
  readonly components: readonly Component[];
  start(): Promise<void>;
  stop(): Promise<void>;
};

export type AppInput = {
  readonly modules?: readonly Module[];
  readonly components?: readonly Component[];
};

export function createApp(input: AppInput = {}): App {
  const modules = input.modules ?? [];
  const components = input.components ?? [];
  const container = new Container();

  for (const module of modules) {
    for (const component of module.components) {
      container.register(component);
    }
  }

  for (const component of components) {
    container.register(component);
  }

  return {
    container,
    modules,
    components,
    async start(): Promise<void> {
      const starters = await container.get(IStarter);

      for (const starter of starters) {
        await starter.onStart();
      }
    },
    async stop(): Promise<void> {
      const stoppers = await container.get(IStopper);

      for (const stopper of stoppers) {
        await stopper.onStop();
      }
    },
  };
}
