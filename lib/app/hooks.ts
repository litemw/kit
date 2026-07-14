import type { ContainerHooks } from "@litemw/iocc";
import type { Logger } from './logger';
import { Err } from "../core/result";

export function createContainerHooks(logger: Logger): ContainerHooks {
  return {
    onRegister(component, tokens) {
      logger.info('Component registered', {
        component: component.name,
        tokens: tokens.map((token) => token.name),
      });
    },
    onResolveStart(token) {
      logger.info('Resolving token', { token: token.name });
    },
    onResolveEnd(token, _value, durationMs) {
      logger.info('Token resolved', { token: token.name, durationMs });
    },
    onFactoryStart(component) {
      logger.info('Factory started', { component: component.name });
    },
    onFactoryEnd(component, _value, durationMs) {
      logger.info('Factory finished', {
        component: component.name,
        durationMs,
      });
    },
    onCacheHit(component) {
      logger.info('Cache hit', { component: component.name });
    },
    onMultiResolve(token, count) {
      logger.info('Multi token resolved', { token: token.name, count });
    },
    onError(error, context) {
      const err = Err(error);
      logger.error(err, 'Container error', { token: context.token?.name });
    },
  };
}
