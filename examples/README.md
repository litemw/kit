# Examples

Runnable usage examples for `@litemw/kit`.

## basic.ts

Minimal app wiring:

- defines a `Greeter` service and registers it in the container via `defIntf`/`defComp`;
- adds a lifecycle component that implements `IStarter`/`IStopper` and receives
  `Greeter` through DI;
- configures a logtape console sink (the default app logger writes to logtape,
  which is silent until configured);
- creates the `App` and runs `start()`/`stop()`.

Run it:

```sh
bun examples/basic.ts
```

Expected output: container and lifecycle events from the app logger, plus
`Hello, world!` and `Goodbye!` printed by the lifecycle component:

```
16:51:43.484 INF app Component greeter registered
16:51:43.484 INF app Component greetOnStart registered
16:51:43.484 INF app Starting app...
16:51:43.484 INF app Token Starter[] resolved
Hello, world!
16:51:43.484 INF app App started 🚀
16:51:43.484 INF app Stopping app...
16:51:43.484 INF app Token Stopper[] resolved
Goodbye!
16:51:43.484 INF app App stopped 🛑
```

## graph.ts

Renders the container as a Graphviz DOT graph via `app.graph()`:

- two named modules (`http`, `storage`) become subgraph clusters;
- `Server` shows every dependency kind: singular (`Config`), multi
  (`IHandler.multi`, drawn with a `[]` label) and optional (`ICache.optional`,
  drawn dotted with a `?` label);
- `UsersHandler`/`HealthHandler` implement `IHandler` (dashed edges with hollow
  arrowheads).

Run it and render an SVG with Graphviz:

```sh
bun examples/graph.ts > graph.dot
dot -Tsvg graph.dot -o graph.svg
```
