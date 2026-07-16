import { Container, TypeOf, type Component } from "@litemw/iocc";
import { createContainerHooks } from "./hooks";
import {
  Aborter,
  AbortControllerComp,
  AbortSignaler,
  IStarter,
  IStopper,
  Stopper,
  AbortReason,
} from "./lifecycle";
import { createLogtapeLogger, type Logger } from "./logger";
import type { Module } from "./module";
import { Err, Ok, type AsyncResult } from "../core/result";

export type AppParams = {
  modules?: Module[];
  components?: Component[];
  logger?: Logger;
  signals?: NodeJS.Signals[];
};

export class App {
  readonly container: Container;
  private modules: Module[];
  private components: Component[];
  private logger: Logger;
  private signals: NodeJS.Signals[];

  private stoppers: Stopper[] = [];
  private aborter?: TypeOf<typeof Aborter>;
  private abortSignal?: AbortSignal;

  constructor(p: AppParams = {}) {
    this.modules = p.modules ?? [];
    this.components = p.components ?? [];
    this.logger = p.logger ?? createLogtapeLogger();
    this.signals = p.signals ?? ["SIGINT", "SIGTERM"];
    this.container = new Container(createContainerHooks(this.logger));

    this.container
      .register(AbortControllerComp)
      .register(AbortSignaler)
      .register(Aborter);

    for (const module of this.modules) {
      for (const component of module.components) {
        this.container.register(component);
      }
    }

    for (const component of this.components) {
      this.container.register(component);
    }
  }

  async start(): AsyncResult<void, unknown> {
    this.logger.info("Starting app...", {
      modules: this.modules.length,
      components: this.components.length,
    });

    const starters = await this.container.get(IStarter);
    this.stoppers = await this.container.get(IStopper);
    this.aborter = await this.container.get(Aborter);
    this.abortSignal = await this.container.get(AbortSignaler);

    for (const starter of starters) {
      try {
        await starter.onStart();
      } catch (err) {
        this.logger.error(Err(err), "Start hook failed");
        return Err(err);
      }
    }

    this.logger.info("🚀 App started", { starters: starters.length });
    return Ok(undefined);
  }

  async stop(
    reason: AbortReason = AbortReason.Stopped,
  ): AsyncResult<void, unknown> {
    this.logger.info("Stopping app...");
    this.aborter?.(reason);
    this.logger.info("Aborter Called with reason {reason}", { reason });

    for (const stopper of this.stoppers) {
      try {
        await stopper.onStop();
      } catch (err) {
        this.logger.error(Err(err), "Stopper hook failed");
        return Err(err);
      }
    }

    this.logger.info("🛑 App stopped", { stoppers: this.stoppers.length });
    return Ok(undefined);
  }

  run(): AsyncResult<void, unknown> {
    const abortSignal = this.abortSignal;
    if (abortSignal?.aborted) {
      return Promise.resolve(Ok(undefined));
    }

    return new Promise((resolve) => {
      const unsubscribe = () => {
        for (const signal of this.signals) {
          process.removeListener(signal, sigHandler);
        }
        abortSignal?.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        unsubscribe();
        this.logger.info("💥 App aborted with reason {reason}, run finished", {
          reason: abortSignal?.reason,
        });
        resolve(Ok(undefined));
      };

      const sigHandler = (signal: NodeJS.Signals) => {
        unsubscribe();
        this.logger.info("🚨 Received {signal}, shutting down gracefully...", {
          signal,
        });
        resolve(this.stop(AbortReason.Shutdown));
      };

      abortSignal?.addEventListener("abort", onAbort);
      for (const signal of this.signals) {
        process.once(signal, sigHandler);
      }
    });
  }
}
