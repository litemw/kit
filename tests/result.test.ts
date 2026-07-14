import { describe, expect, test } from "bun:test";
import { Err, Ok, type Result } from "../lib/core/result";

describe("Result", () => {
  test("contains a successful value when ok is true", () => {
    const result: Result<number, string> = Ok(42);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  test("contains an error when ok is false", () => {
    const result: Result<number, string> = Err("failed");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("failed");
    }
  });
});
