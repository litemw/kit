import { describe, expect, test } from "bun:test";
import { defComp, defIntf } from "@litemw/iocc";
import { App } from "../lib/app/app";
import { containerGraphToDot } from "../lib/app/graph";
import { toRegistration, withIntf } from "../lib/app/entries";
import { createModule } from "../lib/app/module";
import { createTestLogger } from "./test-logger";

type Handler = { handle(): string };

describe("withIntf", () => {
  test("registers a component under extra tokens via modules", async () => {
    const { logger } = createTestLogger();
    const IHandler = defIntf<Handler>("Handler");
    const External = defComp("External").build(() => ({
      handle: () => "external",
    }));
    const app = new App({
      modules: [createModule("m", withIntf(External, IHandler))],
      logger,
    });

    const handler = await app.container.get(IHandler);
    expect(handler.handle()).toBe("external");
  });

  test("registers extra tokens for standalone components", async () => {
    const { logger } = createTestLogger();
    const IHandler = defIntf<Handler>("Handler");
    const External = defComp("External").build(() => ({
      handle: () => "external",
    }));
    const app = new App({
      components: [withIntf(External, IHandler.multi)],
      logger,
    });

    const handlers = await app.container.get(IHandler.multi);
    expect(handlers.map((h) => h.handle())).toEqual(["external"]);
  });

  test("rejects tokens the component value does not implement", () => {
    const INum = defIntf<number>("Num");
    const StringComponent = defComp("StringComponent").build(() => "value");
    // @ts-expect-error a string component cannot implement a number token
    const registration = withIntf(StringComponent, INum);
    expect(registration.tokens).toEqual([INum]);
  });

  test("toRegistration normalizes plain components", () => {
    const component = defComp("Plain").build(() => "x");
    expect(toRegistration(component)).toEqual({ component, tokens: [] });

    const registration = withIntf(component);
    expect(toRegistration(registration)).toBe(registration);
  });
});

describe("withIntf in graphs", () => {
  test("renders extra tokens as implements edges and resolves red marks", () => {
    const IHandler = defIntf<Handler>("Handler");
    const External = defComp("External").build(() => ({ handle: () => "x" }));
    const Consumer = defComp("Consumer")
      .provide(IHandler)
      .build(() => ({}));

    const dot = containerGraphToDot({
      components: [withIntf(External, IHandler), Consumer],
    });

    expect(dot).toContain("c0 -> i0 [style=dashed, arrowhead=empty];");
    expect(dot).not.toContain("color=red");
  });

  test("merges duplicate entries of the same component", () => {
    const IHandler = defIntf<Handler>("Handler");
    const External = defComp("External").build(() => ({ handle: () => "x" }));

    const dot = containerGraphToDot({
      modules: [createModule(External)],
      components: [withIntf(External, IHandler)],
    });

    expect(dot.match(/label="External"/g)).toHaveLength(1);
    expect(dot.match(/c0 -> i0 \[style=dashed/g)).toHaveLength(1);
  });
});
