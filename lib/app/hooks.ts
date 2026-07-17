import type { ContainerHooks, Token } from "@litemw/iocc";
import type { Logger } from "./logger";
import { Err } from "../core/result";
import {
  Aborter,
  AbortControllerComp,
  AbortSignaler,
  IStarter,
  IStopper,
} from "./lifecycle";

// Built-in machinery every app registers; logging it would drown out user
// components. Multi/optional variants share the base token symbol, so the
// check covers Starter[] / Stopper[] as well. Errors are never filtered.
const internalKeys = new Set<symbol>([
  AbortControllerComp.key,
  AbortSignaler.key,
  Aborter.key,
  IStarter.key,
  IStopper.key,
]);

const isInternal = (token: Token) => internalKeys.has(token.key);

export function createContainerHooks(logger: Logger): ContainerHooks {
  return {
    onRegister(component, tokens) {
      if (isInternal(component)) return;
      logger.info("Component {component} registered", {
        component: component.name,
        tokens: tokens.map((token) => token.name),
      });
    },
    onResolveStart(token) {
      if (isInternal(token)) return;
      logger.debug("Resolving token {token}", { token: token.name });
    },
    onResolveEnd(token, _value, durationMs) {
      if (isInternal(token)) return;
      logger.info("Token {token} resolved", { token: token.name, durationMs });
    },
    onFactoryStart(component) {
      if (isInternal(component)) return;
      logger.debug("Factory started for component {component}", {
        component: component.name,
      });
    },
    onFactoryEnd(component, _value, durationMs) {
      if (isInternal(component)) return;
      logger.debug("Factory finished for component {component}", {
        component: component.name,
        durationMs,
      });
    },
    onCacheHit(component) {
      if (isInternal(component)) return;
      logger.debug("Cache hit for component {component}", {
        component: component.name,
      });
    },
    onMultiResolve(token, count) {
      if (isInternal(token)) return;
      logger.debug("Multi token {token} resolved", {
        token: token.name,
        count,
      });
    },
    onError(error, context) {
      const err = Err(error);
      logger.error(err, "Container error, token: {token}", {
        token: context.token?.name,
      });
    },
  };
}
