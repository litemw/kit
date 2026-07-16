import { describe, expect, test } from "bun:test";
import { defComp } from "@litemw/iocc";
import { App } from "../lib/app/app";
import { createModule } from "../lib/app/module";
import { AbortSignaler, IStarter, IStopper } from "../lib/app/lifecycle";
import { createTestLogger } from "./test-logger";

describe("App", () => {
  test("uses provided logger and logs lifecycle", async () => {
    const { logger, records } = createTestLogger();
    const app = new App({ logger });

    await app.start();
    await app.stop();

    const infoMessages = records
      .filter((r) => r.level === "info")
      .map((r) => r.msg);
    expect(infoMessages).toContain("App started 🚀");
    expect(infoMessages).toContain("App stopped 🛑");
  });

  test("registers components", async () => {
    const calls: string[] = [];
    const mkStarter = (name: string) =>
      defComp(name)
        .as(IStarter)
        .build(() => ({
          onStart: () => {
            calls.push(name);
          },
        }));

    const app = new App({ components: [mkStarter("a"), mkStarter("b")] });
    await app.start();

    expect(calls.sort()).toEqual(["a", "b"]);
  });

  test("registers components from modules", async () => {
    const calls: string[] = [];
    const component = defComp("moduleComponent")
      .as(IStarter)
      .build(() => ({
        onStart: () => {
          calls.push("module");
        },
      }));

    const app = new App({ modules: [createModule(component)] });
    await app.start();

    expect(calls).toEqual(["module"]);
  });

  test("gracefulShutdown stops the app on a signal", async () => {
    const calls: string[] = [];
    const stopper = defComp("stopper")
      .as(IStopper)
      .build(() => ({
        onStop: () => {
          calls.push("stop");
        },
      }));

    const app = new App({ components: [stopper] });
    await app.start();
    const signal = await app.container.get(AbortSignaler);

    app.waitSignals(["SIGUSR2"]);
    process.emit("SIGUSR2");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls).toEqual(["stop"]);
    expect(signal.aborted).toBe(true);
    expect(process.listenerCount("SIGUSR2")).toBe(0);
  });

  test("gracefulShutdown logs the error and sets exit code when stop fails", async () => {
    const { logger, records } = createTestLogger();
    const stopper = defComp("failingStopper")
      .as(IStopper)
      .build(() => ({
        onStop: () => {
          throw new Error("stop failed");
        },
      }));

    const app = new App({ components: [stopper], logger });
    await app.start();
    const prevExitCode = process.exitCode;

    try {
      app.waitSignals(["SIGUSR2"]);
      process.emit("SIGUSR2");
      await new Promise((resolve) => setTimeout(resolve, 0));

      const errorMessages = records
        .filter((r) => r.level === "error")
        .map((r) => r.msg);
      expect(errorMessages).toContain("Graceful shutdown failed");
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = prevExitCode;
    }
  });

  test("gracefulShutdown returns an unsubscribe function", async () => {
    const calls: string[] = [];
    const stopper = defComp("stopper")
      .as(IStopper)
      .build(() => ({
        onStop: () => {
          calls.push("stop");
        },
      }));

    const app = new App({ components: [stopper] });
    await app.start();

    const unsubscribe = app.waitSignals(["SIGUSR2"]);
    unsubscribe();
    process.emit("SIGUSR2");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls).toEqual([]);
    expect(process.listenerCount("SIGUSR2")).toBe(0);
  });
});
