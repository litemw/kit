import { defineInterface } from "@litemw/iocc";

export type Starter = {
  onStart(): void | Promise<void>;
};

export type Stopper = {
  onStop(): void | Promise<void>;
};

export const IStarter = defineInterface<Starter>('Starter').multi;
export const IStopper = defineInterface<Stopper>('Stopper').multi;
