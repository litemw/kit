import { defComp, defIntf } from "@litemw/iocc";

export type Starter = {
  onStart(): void | Promise<void>;
};

export type Stopper = {
  onStop(): void | Promise<void>;
};

export const IStarter = defIntf<Starter>("Starter").multi;
export const IStopper = defIntf<Stopper>("Stopper").multi;

export const AbortControllerComp = defComp("AbortController").build(() => {
  const controller = new AbortController();
  return controller;
});

export const AbortSignaler = defComp("AbortSignaler")
  .provide(AbortControllerComp)
  .build((c) => {
    return c.signal;
  });

export const Aborter = defComp("Aborter")
  .provide(AbortControllerComp)
  .build((c) => {
    return c.abort.bind(c);
  });

export enum AbortReason {
  Stopped = "Stopped",
  Shutdown = "Shutdown",
}
