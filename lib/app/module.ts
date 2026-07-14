import type { Component } from "@litemw/iocc";

export type Module = {
  readonly components: readonly Component[];
};

export function createModule(...components: readonly Component[]): Module {
  return { components };
}
