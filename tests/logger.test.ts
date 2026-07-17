import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { configure, reset, type LogRecord } from "@logtape/logtape";
import { createConsoleLogger, createLogtapeLogger } from "../lib/app/logger";
import { Err } from "../lib/core/result";

describe("ConsoleLogger", () => {
  test("logs info and error with interpolation, hides debug by default", () => {
    const debug = spyOn(console, "debug").mockImplementation(() => {});
    const info = spyOn(console, "info").mockImplementation(() => {});
    const error = spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("boom");

    const logger = createConsoleLogger();
    logger.debug("hidden");
    logger.info("Component {component} registered", { component: "Server" });
    logger.error(Err(failure), "{hook} hook failed", { hook: "start" });

    expect(debug).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith("[info] Component Server registered");
    expect(error).toHaveBeenCalledWith("[error] start hook failed", failure);

    debug.mockRestore();
    info.mockRestore();
    error.mockRestore();
  });

  test("suppresses info below the error level", () => {
    const log = spyOn(console, "log").mockImplementation(() => {});
    const error = spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("boom");

    const logger = createConsoleLogger("error");
    logger.info("hidden");
    logger.error(Err(failure), "failed");

    expect(log).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("[error] failed", failure);

    log.mockRestore();
    error.mockRestore();
  });

  test("logs debug at the debug level and keeps unknown placeholders", () => {
    const debug = spyOn(console, "debug").mockImplementation(() => {});

    const logger = createConsoleLogger("debug");
    logger.debug("Resolving token {token}");
    logger.debug("count is {count}", { count: 2 });

    expect(debug).toHaveBeenCalledWith("[debug] Resolving token {token}");
    expect(debug).toHaveBeenCalledWith("[debug] count is 2");

    debug.mockRestore();
  });
});

describe("LogtapeLogger", () => {
  const records: LogRecord[] = [];

  beforeAll(async () => {
    await configure({
      sinks: {
        test(record) {
          records.push(record);
        },
      },
      loggers: [
        { category: "app", sinks: ["test"], lowestLevel: "debug" },
        { category: ["logtape", "meta"], sinks: [] },
      ],
    });
  });

  afterAll(async () => {
    await reset();
  });

  test("forwards debug, info, and error to logtape", () => {
    const logger = createLogtapeLogger();
    const failure = new Error("boom");

    logger.debug("debug message");
    logger.info("info message", { key: "value" });
    logger.error(Err(failure), "error message", { key: "value" });

    expect(records.map((r) => [r.level, r.rawMessage])).toEqual([
      ["debug", "debug message"],
      ["info", "info message"],
      ["error", "error message"],
    ]);
    expect(records[1]?.properties).toEqual({ key: "value" });
    expect(records[2]?.properties).toEqual({
      key: "value",
      error: Err(failure),
    });
  });
});
