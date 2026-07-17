import { describe, expect, test } from "bun:test";
import { defComp, defIntf } from "@litemw/iocc";
import { App } from "../lib/app/app";
import { containerGraphToDot } from "../lib/app/graph";
import { createModule } from "../lib/app/module";
import { createTestLogger } from "./test-logger";

type Handler = { handle(): void };

describe("containerGraphToDot", () => {
  test("renders component nodes and dependency edges", () => {
    const Config = defComp("Config").build(() => ({ port: 3000 }));
    const Server = defComp("Server")
      .provide(Config)
      .build((config) => ({ config }));

    const dot = containerGraphToDot({ components: [Config, Server] });

    expect(dot).toStartWith("digraph Container {");
    expect(dot).toContain('c0 [label="Config", shape=box];');
    expect(dot).toContain('c1 [label="Server", shape=box];');
    expect(dot).toContain("c1 -> c0;");
  });

  test("renders implemented interfaces with implements-style edges", () => {
    const IHandler = defIntf<Handler>("Handler");
    const HttpHandler = defComp("HttpHandler")
      .as(IHandler)
      .build(() => ({ handle: () => {} }));

    const dot = containerGraphToDot({ components: [HttpHandler] });

    expect(dot).toContain('i0 [label="Handler", shape=ellipse];');
    expect(dot).toContain("c0 -> i0 [style=dashed, arrowhead=empty];");
  });

  test("dedupes multi and optional variants into the base interface node", () => {
    const IHandler = defIntf<Handler>("Handler");
    const ICache = defIntf<Handler>("Cache");
    const Consumer = defComp("Consumer")
      .provide(IHandler.multi, IHandler.optional, ICache.optional, ICache.multi)
      .build(() => ({}));

    const dot = containerGraphToDot({ components: [Consumer] });

    expect(dot).toContain('i0 [label="Handler", shape=ellipse];');
    expect(dot).toContain('i1 [label="Cache", shape=ellipse];');
    expect(dot).not.toContain("i2");
    expect(dot).toContain('c0 -> i0 [label="[]"];');
    expect(dot).toContain('c0 -> i0 [style=dotted, label="?"];');
    expect(dot).toContain('c0 -> i1 [label="[]"];');
    expect(dot).toContain('c0 -> i1 [style=dotted, label="?"];');
  });

  test("marks unresolved singular dependencies in red", () => {
    const IHandler = defIntf<Handler>("Handler");
    const Consumer = defComp("Consumer")
      .provide(IHandler)
      .build(() => ({}));

    const dot = containerGraphToDot({ components: [Consumer] });

    expect(dot).toContain('i0 [label="Handler", shape=ellipse, color=red];');
  });

  test("does not mark implemented or non-singular dependencies in red", () => {
    const IHandler = defIntf<Handler>("Handler");
    const HttpHandler = defComp("HttpHandler")
      .as(IHandler)
      .build(() => ({ handle: () => {} }));
    const Consumer = defComp("Consumer")
      .provide(IHandler, IHandler.multi)
      .build(() => ({}));

    const dot = containerGraphToDot({ components: [HttpHandler, Consumer] });

    expect(dot).not.toContain("color=red");
  });

  test("groups module components into named clusters", () => {
    const Config = defComp("Config").build(() => ({}));
    const Server = defComp("Server").build(() => ({}));

    const dot = containerGraphToDot({
      modules: [createModule("http", Server), createModule(Config)],
    });

    expect(dot).toContain("subgraph cluster_0 {");
    expect(dot).toContain('label="http";');
    expect(dot).toContain('label="module 2";');
  });

  test("renders module components without clusters when disabled", () => {
    const Server = defComp("Server").build(() => ({}));

    const dot = containerGraphToDot(
      { modules: [createModule("http", Server)] },
      { clusters: false },
    );

    expect(dot).not.toContain("subgraph");
    expect(dot).toContain('c0 [label="Server", shape=box];');
  });

  test("applies rankdir option", () => {
    const dot = containerGraphToDot({}, { rankdir: "TB" });
    expect(dot).toContain("rankdir=TB;");
  });

  test("escapes quotes and backslashes in labels", () => {
    const Weird = defComp('Weird "name" \\ test').build(() => ({}));

    const dot = containerGraphToDot({ components: [Weird] });

    expect(dot).toContain('label="Weird \\"name\\" \\\\ test"');
  });
});

describe("App.graph", () => {
  test("excludes internal lifecycle components by default", () => {
    const { logger } = createTestLogger();
    const Server = defComp("Server").build(() => ({}));
    const app = new App({ components: [Server], logger });

    const dot = app.graph();

    expect(dot).toContain('label="Server"');
    expect(dot).not.toContain("AbortController");
  });

  test("includes internal lifecycle components when requested", () => {
    const { logger } = createTestLogger();
    const app = new App({ logger });

    const dot = app.graph({ includeInternal: true });

    expect(dot).toContain('label="AbortController"');
    expect(dot).toContain('label="AbortSignaler"');
    expect(dot).toContain('label="Aborter"');
  });
});
