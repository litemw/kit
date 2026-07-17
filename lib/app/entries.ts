import type { Component, ImplOf, Token } from "@litemw/iocc";

/** A component paired with extra interface tokens to register it under. */
export type Registration = {
  readonly component: Component;
  readonly tokens: readonly Token[];
};

export type ComponentEntry = Component | Registration;

type TokenAssert<Ret, I extends Token> = Ret extends ImplOf<I> ? I : never;
type TokenTupleAssert<Ret, Tokens extends readonly Token[]> = {
  [K in keyof Tokens]: Tokens[K] extends Token
    ? TokenAssert<Ret, Tokens[K]>
    : never;
};

/**
 * Pairs a component with additional compatible tokens, mirroring
 * container.register(component, ...tokens) — useful to bind a component
 * you cannot rebuild with as(), e.g. one from another package.
 */
export function withIntf<Ret, const Tokens extends readonly Token[]>(
  component: Component<readonly Token[], Ret>,
  ...tokens: Tokens & TokenTupleAssert<Ret, Tokens>
): Registration {
  return { component, tokens };
}

export function toRegistration(entry: ComponentEntry): Registration {
  return "component" in entry ? entry : { component: entry, tokens: [] };
}
