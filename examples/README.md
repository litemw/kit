# Examples

Runnable usage examples for `@litemw/kit`, ordered from a bare app to graph
visualization. Run any of them with bun:

```sh
bun examples/02-component.ts
```

The app logs to the console out of the box; events for the built-in
components (abort machinery, `Starter`/`Stopper` tokens) are not logged.

## 01-minimal.ts

The smallest possible app: no components at all. The app still owns a
container with the built-in abort components, runs `start()` and blocks in
`run()` until Ctrl+C.

## 02-component.ts

Defines two components with `defComp`: `Config` and a `Greeter` that receives
it via `provide()`. Resolves `Greeter` through `app.container` — factories run
lazily and the result is cached.

## 03-factories-and-classes.ts

Wires existing code into the container without inline closures: an external
factory function (`createPool`) is passed straight to `build()` since its
signature matches the provided dependencies, and a `UserService` class is
constructed by a one-line `(pool) => new UserService(pool)` factory.

## 04-lifecycle-hooks.ts

Registers components under the `IStarter`/`IStopper` multi tokens: `Server`
implements both hooks, `Migrations` only `onStart`. `app.start()` runs every
starter, `app.stop()` every stopper.

## 05-modules.ts

Groups components into named modules (`storage`, `http`) with `createModule`.
Modules share one container, so `HttpServer` from the `http` module receives
the `UserRepository` interface implemented in the `storage` module.

## 06-abort.ts

App-wide cancellation: a `Worker` provides `AbortSignaler` and stops its timer
when the shared signal aborts; outside code resolves `Aborter` and cancels the
app with a custom reason. `app.run()` blocks until the abort (or SIGINT/
SIGTERM) arrives.

## 07-custom-logger.ts

Replaces the default console logger with a hand-written implementation of the
`Logger` interface — registration and resolution events from the container
hooks go through it, and a failing starter demonstrates the error path.

## 08-logtape-logger.ts

Swaps the default logger for the [logtape](https://logtape.org) adapter via
`createLogtapeLogger()` for structured logging. Logtape is silent until
configured, so the example sets up a console sink first.

## 09-graph.ts

Renders the container as a Graphviz DOT graph via `app.graph()`:

- two named modules (`http`, `storage`) become subgraph clusters;
- `Server` shows every dependency kind: singular (`Config`), multi
  (`IHandler.multi`, drawn with a `[]` label) and optional (`ICache.optional`,
  drawn dotted with a `?` label);
- `UsersHandler`/`HealthHandler` implement `IHandler` (dashed edges with hollow
  arrowheads).

The app is created with `createConsoleLogger('error')` so stdout stays clean
DOT. Run it and render an SVG with Graphviz:

```sh
bun examples/09-graph.ts > graph.dot
dot -Tsvg graph.dot -o graph.svg
```
