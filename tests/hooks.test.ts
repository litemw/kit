import { describe, expect, test } from "bun:test";
import { defComp, defIntf } from "@litemw/iocc";
import { App } from "../lib/app/app";
import { createTestLogger } from "./test-logger";

describe("ContainerHooks", () => {
  test("logs container events", async () => {
    const { logger, records } = createTestLogger();
    const component = defComp("component").build(() => "value");
    const app = new App({ components: [component], logger });

    await app.container.get(component);

    const messages = records.map((r) => r.msg);
    expect(messages).toContain("Component {component} registered");
    expect(messages).toContain("Factory finished for component {component}");
  });

  test("does not log events for internal components and tokens", async () => {
    const { logger, records } = createTestLogger();
    const app = new App({ logger });

    await app.start();
    await app.stop();

    const names = records.flatMap((r) => [r.kv?.component, r.kv?.token]);
    for (const internal of [
      "AbortController",
      "AbortSignaler",
      "Aborter",
      "Starter[]",
      "Stopper[]",
    ]) {
      expect(names).not.toContain(internal);
    }
  });

  test("logs cache hits for user components", async () => {
    const { logger, records } = createTestLogger();
    const component = defComp("component").build(() => "value");
    const app = new App({ components: [component], logger });

    await app.container.get(component);
    await app.container.get(component);

    const messages = records.map((r) => r.msg);
    expect(messages).toContain("Cache hit for component {component}");
  });

  test("logs multi resolution of user tokens", async () => {
    const { logger, records } = createTestLogger();
    const IThing = defIntf<string>("Thing");
    const ThingComponent = defComp("ThingComponent")
      .as(IThing.multi)
      .build(() => "thing");
    const app = new App({ components: [ThingComponent], logger });

    await app.container.get(IThing.multi);

    const messages = records.map((r) => r.msg);
    expect(messages).toContain("Multi token {token} resolved");
  });

  test("logs container errors", async () => {
    const { logger, records } = createTestLogger();
    const app = new App({ logger });
    const IMissing = defIntf<string>("Missing");

    expect(() => app.container.get(IMissing)).toThrow("not registered");

    const errorRecord = records.find((r) => r.level === "error");
    expect(errorRecord?.msg).toBe("Container error, token: {token}");
  });
});
