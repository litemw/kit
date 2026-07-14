import type { ContainerHooks } from "@litemw/iocc";
import type { Logger } from "./logger";
import { Err } from "../core/result";

export function createContainerHooks(logger: Logger): ContainerHooks {
  return {
    onRegister(component, tokens) {
      logger.info("Component {component} registered", {
        component: component.name,
        tokens: tokens.map((token) => token.name),
      });
    },
    onResolveStart(token) {
      logger.debug("Resolving token {token}", { token: token.name });
    },
    onResolveEnd(token, _value, durationMs) {
      logger.info("Token {token} resolved", { token: token.name, durationMs });
    },
    onFactoryStart(component) {
      logger.debug("Factory started for component {component}", {
        component: component.name,
      });
    },
    onFactoryEnd(component, _value, durationMs) {
      logger.debug("Factory finished for component {component}", {
        component: component.name,
        durationMs,
      });
    },
    onCacheHit(component) {
      logger.debug("Cache hit for component {component}", {
        component: component.name,
      });
    },
    onMultiResolve(token, count) {
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
