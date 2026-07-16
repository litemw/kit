import { describe, expect, test } from "bun:test";
import { defComp } from "@litemw/iocc";
import { App } from "../lib/app/app";
import { createModule } from "../lib/app/module";
import { AbortSignaler, IStarter, IStopper } from "../lib/app/lifecycle";
import { Err, Ok } from "../lib/core/result";
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
    expect(infoMessages).toContain("🚀 App started");
    expect(infoMessages).toContain("🛑 App stopped");
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

  test("run stops the app on a signal", async () => {
    const calls: string[] = [];
    const stopper = defComp("stopper")
      .as(IStopper)
      .build(() => ({
        onStop: () => {
          calls.push("stop");
        },
      }));

    const app = new App({ components: [stopper], signals: ["SIGUSR2"] });
    await app.start();
    const signal = await app.container.get(AbortSignaler);

    const running = app.run();
    process.emit("SIGUSR2");

    expect(await running).toEqual(Ok(undefined));
    expect(calls).toEqual(["stop"]);
    expect(signal.aborted).toBe(true);
    expect(process.listenerCount("SIGUSR2")).toBe(0);
  });

  test("run resolves with Err when stop fails", async () => {
    const { logger, records } = createTestLogger();
    const failure = new Error("stop failed");
    const stopper = defComp("failingStopper")
      .as(IStopper)
      .build(() => ({
        onStop: () => {
          throw failure;
        },
      }));

    const app = new App({
      components: [stopper],
      logger,
      signals: ["SIGUSR2"],
    });
    await app.start();

    const running = app.run();
    process.emit("SIGUSR2");

    expect(await running).toEqual(Err(failure));
    const errorMessages = records
      .filter((r) => r.level === "error")
      .map((r) => r.msg);
    expect(errorMessages).toContain("Stopper hook failed");
    expect(process.listenerCount("SIGUSR2")).toBe(0);
  });

  test("run resolves when the app is stopped manually", async () => {
    const app = new App({ signals: ["SIGUSR2"] });
    await app.start();

    const running = app.run();
    await app.stop();

    expect(await running).toEqual(Ok(undefined));
    expect(process.listenerCount("SIGUSR2")).toBe(0);
  });

  test("run resolves immediately if the app is already stopped", async () => {
    const app = new App({ signals: ["SIGUSR2"] });
    await app.start();
    await app.stop();

    expect(await app.run()).toEqual(Ok(undefined));
    expect(process.listenerCount("SIGUSR2")).toBe(0);
  });
});
