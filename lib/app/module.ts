import type { ComponentEntry } from "./entries";

export type Module = {
  readonly name?: string;
  readonly components: readonly ComponentEntry[];
};

export function createModule(...components: readonly ComponentEntry[]): Module;
export function createModule(
  name: string,
  ...components: readonly ComponentEntry[]
): Module;
export function createModule(
  first?: string | ComponentEntry,
  ...rest: readonly ComponentEntry[]
): Module {
  if (typeof first === "string") {
    return { name: first, components: rest };
  }
  return { components: first ? [first, ...rest] : [] };
}
