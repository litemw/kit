import type { Component } from "@litemw/iocc";

export type Module = {
  readonly name?: string;
  readonly components: readonly Component[];
};

export function createModule(...components: readonly Component[]): Module;
export function createModule(
  name: string,
  ...components: readonly Component[]
): Module;
export function createModule(
  first?: string | Component,
  ...rest: readonly Component[]
): Module {
  if (typeof first === "string") {
    return { name: first, components: rest };
  }
  return { components: first ? [first, ...rest] : [] };
}
