import { defIntf } from '@litemw/iocc';

export type Starter = {
  onStart(): void | Promise<void>;
};

export type Stopper = {
  onStop(): void | Promise<void>;
};

export const IStarter = defIntf<Starter>('Starter').multi;
export const IStopper = defIntf<Stopper>('Stopper').multi;
