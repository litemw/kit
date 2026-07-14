import { Container, type Component } from "@litemw/iocc";
import { createContainerHooks } from "./hooks";
import { IStarter, IStopper } from "./lifecycle";
import { createLogtapeLogger, type Logger } from "./logger";
import type { Module } from "./module";
import { Err } from "../core/result";

export type AppParams = {
  modules?: Module[];
  components?: Component[];
  logger?: Logger;
};

export class App {
  private container: Container;
  private modules: Module[];
  private components: Component[];
  private logger: Logger;

  constructor(p: AppParams = {}) {
    this.modules = p.modules ?? [];
    this.components = p.components ?? [];
    this.logger = p.logger ?? createLogtapeLogger();
    this.container = new Container(createContainerHooks(this.logger));

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
    this.logger.info("Starting app...", {
      modules: this.modules.length,
      components: this.components.length,
    });

    const starters = await this.container.get(IStarter);

    for (const starter of starters) {
      try {
        await starter.onStart();
      } catch (err) {
        this.logger.error(Err(err), "Start hook failed");
        throw err;
      }
    }

    this.logger.info("App started 🚀", { starters: starters.length });
  }

  async stop(): Promise<void> {
    this.logger.info("Stopping app...");

    const stoppers = await this.container.get(IStopper);

    for (const stopper of stoppers) {
      try {
        await stopper.onStop();
      } catch (err) {
        this.logger.error(Err(err), "Stopper hook failed");
        throw err;
      }
    }

    this.logger.info("App stopped 🛑", { stoppers: stoppers.length });
  }
}
