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

  test("logs container errors", async () => {
    const { logger, records } = createTestLogger();
    const app = new App({ logger });
    const IMissing = defIntf<string>("Missing");

    expect(() => app.container.get(IMissing)).toThrow("not registered");

    const errorRecord = records.find((r) => r.level === "error");
    expect(errorRecord?.msg).toBe("Container error, token: {token}");
  });
});
