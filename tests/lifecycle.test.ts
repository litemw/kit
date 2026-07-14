import { describe, expect, test } from "bun:test";
import { defComp } from "@litemw/iocc";
import { App } from "../lib/app/app";
import { createModule } from "../lib/app/module";
import {
  Aborter,
  AbortSignaler,
  IStarter,
  IStopper,
} from "../lib/app/lifecycle";
import { Err } from "../lib/core/result";
import { createTestLogger } from "./test-logger";

describe("Lifecycle hooks", () => {
  test("registers module components and runs lifecycle hooks", async () => {
    const calls: string[] = [];
    const lifecycleComponent = defComp("lifecycle")
      .as(IStarter)
      .as(IStopper)
      .build(() => ({
        onStart: () => {
          calls.push("start");
        },
        onStop: () => {
          calls.push("stop");
        },
      }));

    const app = new App({
      modules: [createModule(lifecycleComponent)],
    });

    await app.start();
    await app.stop();

    expect(calls).toEqual(["start", "stop"]);
  });

  test("logs and rethrows hook errors", async () => {
    const { logger, records } = createTestLogger();
    const failure = new Error("boom");
    const failingStarter = defComp("failing")
      .as(IStarter)
      .build(() => ({
        onStart: () => {
          throw failure;
        },
      }));

    const app = new App({ components: [failingStarter], logger });

    await expect(app.start()).rejects.toThrow("boom");
    const errorRecord = records.find((r) => r.level === "error");
    expect(errorRecord?.msg).toBe("Start hook failed");
    expect(errorRecord?.err).toEqual(Err(failure));
  });
});

describe("AbortSignaler / Aborter", () => {
  test("provides a signal that is not aborted by default", async () => {
    const app = new App();

    const signal = await app.container.get(AbortSignaler);

    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
  });

  test("Aborter aborts the signal from AbortSignaler", async () => {
    const app = new App();

    const signal = await app.container.get(AbortSignaler);
    const { abort } = { abort: await app.container.get(Aborter) };

    expect(typeof abort).toBe("function");
    abort();

    expect(signal.aborted).toBe(true);
  });

  test("resolves the same signal instance on repeated gets", async () => {
    const app = new App();

    const signal1 = await app.container.get(AbortSignaler);
    const signal2 = await app.container.get(AbortSignaler);

    expect(signal1).toBe(signal2);
  });
});
