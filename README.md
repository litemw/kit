# @litemw/kit

[![CI](https://github.com/litemw/kit/actions/workflows/ci.yml/badge.svg)](https://github.com/litemw/kit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@litemw/kit.svg)](https://www.npmjs.com/package/@litemw/kit)
[![coverage](https://codecov.io/github/litemw/kit/graph/badge.svg)](https://app.codecov.io/github/litemw/kit)
[![license](https://img.shields.io/npm/l/@litemw/kit.svg)](./LICENSE)

An application kit inspired by go/fx on top of [@litemw/iocc](https://github.com/litemw/iocc) — modules, lifecycle and structured logging for container-driven apps.

🧩 **Modular** — group components into modules and compose apps from them

🔄 **Lifecycle** — `IStarter`/`IStopper` hooks run on `app.start()` / `app.stop()`

📝 **Observable** — every container event (register, resolve, factory, cache) is logged

🪵 **Logging included** — console logger out of the box, logtape adapter for structured logging, swappable via the `Logger` interface

🛡️ **Type-safe** — everything is wired through typed iocc tokens, no casts

## 📦 Install

```sh
npm install @litemw/kit @litemw/iocc
# or
pnpm add @litemw/kit @litemw/iocc
# or
yarn add @litemw/kit @litemw/iocc
# or
bun add @litemw/kit @litemw/iocc
# or
deno add npm:@litemw/kit npm:@litemw/iocc
```

`@litemw/iocc` is a peer dependency.

## 🧩 Core concepts

| Concept | Description |
|---|---|
| `App` | Owns the container, registers modules/components, runs the lifecycle |
| `Module` | A group of components, created with `createModule()` |
| `IStarter` / `IStopper` | Multi tokens — every implementation runs on start/stop |
| `AbortSignaler` / `Aborter` | Built-in app-wide `AbortSignal` and the function that aborts it |
| `Logger` | Logging interface the app uses internally — bring your own via `AppInput` |
| `Result` / `Ok` / `Err` | Minimal result type used for error reporting |

## 🚀 Quick start

```ts
import { defComp, defIntf } from '@litemw/iocc';
import { App, createModule, IStarter, IStopper } from '@litemw/kit';

// 1. Define a domain service
type Greeter = {
  greet(name: string): string;
};

const IGreeter = defIntf<Greeter>('Greeter');

const GreeterComponent = defComp('greeter')
  .as(IGreeter)
  .build(() => ({
    greet: (name: string) => `Hello, ${name}!`,
  }));

// 2. Define a lifecycle component
const GreetOnStart = defComp('greetOnStart')
  .provide(IGreeter)
  .as(IStarter)
  .as(IStopper)
  .build((greeter) => ({
    onStart() {
      console.log(greeter.greet('world'));
    },
    onStop() {
      console.log('Goodbye!');
    },
  }));

// 3. Compose and run
const app = new App({
  modules: [createModule(GreeterComponent, GreetOnStart)],
});

await app.start(); // runs every IStarter
await app.stop();  // runs every IStopper
```

## 🧪 Examples

Runnable examples live in [`examples/`](./examples), ordered from a bare app
to graph visualization:

```sh
bun examples/02-component.ts
bun examples/09-graph.ts
```

## 📖 API

### `App`

```ts
const app = new App({
  modules,    // readonly Module[]    — groups of components
  components, // readonly Component[] — standalone components
  logger,     // Logger               — defaults to a console logger (info level)
  signals,    // NodeJS.Signals[]     — signals app.run() listens to (default ['SIGINT', 'SIGTERM'])
});
```

The constructor creates a `Container` with logging hooks attached, registers
the built-in abort components (`AbortControllerComp`, `AbortSignaler`,
`Aborter`), then registers every component from `modules` and `components`.
The container is available as `app.container`.

- `app.start()` — resolves all `IStarter` implementations and calls `onStart()` on each, in order; returns `Result<void, unknown>`
- `app.stop(reason?)` — aborts the shared signal (default reason `AbortReason.Stopped`), then resolves all `IStopper` implementations and calls `onStop()` on each, in order; returns `Result<void, unknown>`
- `app.run()` — blocks until one of the configured `signals` arrives (then calls `app.stop(AbortReason.Shutdown)` and resolves with its `Result<void, unknown>`) or until the shared `AbortSignal` aborts — e.g. `app.stop()` or `Aborter` was called elsewhere (then resolves with `Ok`)

If a hook throws, the error is logged and returned as `Err`.

```ts
const app = new App({ modules });
await app.start();
const result = await app.run(); // resolves on Ctrl+C / SIGTERM after a clean stop
if (!result.ok) process.exitCode = 1;
```

Handlers are removed after the first signal, so a second signal terminates
the process immediately.

- `app.graph(options?)` — renders the container as a [Graphviz DOT](https://graphviz.org/doc/info/lang.html) graph; see [`containerGraphToDot`](#containergraphtodotparams-options)

### `createModule(...components)`

Groups components into a module. Pass a name as the first argument to label
the module (used as the cluster title in DOT graphs):

```ts
const userModule = createModule('users', UserRepository, UserService, UserController);
const authModule = createModule(AuthService); // name is optional

const app = new App({ modules: [userModule, authModule] });
```

### `withIntf(component, ...interfaces)`

Pairs a component with additional compatible tokens, mirroring
`container.register(component, ...tokens)` from iocc. Useful when a component
cannot be rebuilt with `as()` — e.g. it comes from another package — but
should be exposed under your local interface:

```ts
import { createModule, withIntf } from '@litemw/kit';
import { MetricsComponent } from 'some-package';

const module = createModule('metrics', withIntf(MetricsComponent, IReporter.multi));
// also accepted in the standalone list:
const app = new App({ components: [withIntf(MetricsComponent, IReporter.multi)] });
```

The binding is type-checked: `withIntf` only accepts tokens whose interface
the component value implements. The DOT graph renders extra tokens as
implements-edges, same as `as()` declarations.

### `containerGraphToDot(params, options?)`

Builds a [Graphviz DOT](https://graphviz.org/doc/info/lang.html) graph of the
container from static component metadata — no resolution happens, so it works
before `app.start()`:

```ts
const dot = containerGraphToDot({ modules, components });
// or, from an app instance:
const dot = app.graph();
console.log(dot);
```

Render it with Graphviz: `bun run graph.ts > graph.dot && dot -Tsvg graph.dot -o graph.svg`.

Graph legend:

- component — box; interface — ellipse
- solid edge `A -> B` — `A` depends on `B` (label `[]` for multi, dotted with `?` for optional)
- dashed edge with a hollow arrowhead — the component is registered under that interface (`as(...)`)
- red ellipse — an interface required as a singular dependency with no registered implementation
- named modules become `subgraph cluster_*` groups

Options (`ContainerGraphOptions`):

- `rankdir` — layout direction: `'LR'` (default), `'RL'`, `'TB'`, `'BT'`
- `clusters` — group module components into clusters (default `true`)

`app.graph(options)` additionally accepts:

- `includeInternal` — include the built-in `AbortControllerComp` / `AbortSignaler` / `Aborter` components (default `false`)

### `IStarter` / `IStopper`

Multi tokens for lifecycle hooks. Register any number of implementations —
the app runs them all:

```ts
import { IStarter, IStopper, type Starter, type Stopper } from '@litemw/kit';

const Server = defComp('server')
  .as(IStarter)
  .as(IStopper)
  .build(() => ({
    async onStart() { /* listen */ },
    async onStop() { /* close */ },
  }));
```

Hooks can be sync or async (`void | Promise<void>`).

### `AbortSignaler` / `Aborter`

Every `App` pre-registers a shared `AbortController` and exposes it through two
components:

- `AbortSignaler` — resolves to the controller's `AbortSignal`
- `Aborter` — resolves to a bound `abort()` function that aborts that signal

Both resolve from the same underlying controller (`AbortControllerComp`), so
the signal is a singleton per app — every component that provides
`AbortSignaler` sees the same instance.

Use them to wire app-wide cancellation without passing an `AbortController`
around manually:

```ts
import { defComp } from '@litemw/iocc';
import { App, Aborter, AbortSignaler, IStarter, IStopper } from '@litemw/kit';

const Worker = defComp('worker')
  .provide(AbortSignaler)
  .as(IStarter)
  .build((signal) => ({
    onStart() {
      signal.addEventListener('abort', () => {
        /* stop in-flight work */
      });
    },
  }));

const Shutdown = defComp('shutdown')
  .provide(Aborter)
  .as(IStopper)
  .build((abort) => ({
    onStop() {
      abort(); // aborts the shared signal
    },
  }));

const app = new App({ components: [Worker, Shutdown] });
```

The signal is also handy for anything that accepts `AbortSignal` natively —
`fetch`, timers, streams:

```ts
const signal = await app.container.get(AbortSignaler);
await fetch(url, { signal });
```

### `Logger`

The logging interface the app uses internally — for lifecycle and container
events:

```ts
type Logger = {
  debug(msg: string, kv?: Record<string, unknown>): void;
  info(msg: string, kv?: Record<string, unknown>): void;
  error(err: Err<unknown>, msg: string, kv?: Record<string, unknown>): void;
};
```

Pass your own implementation to the `App` constructor to replace the default:

```ts
const app = new App({ modules, logger: myLogger });
```

### `createConsoleLogger(lowestLevel?)`

Creates the default console-backed `Logger`. Prints `[level] message` lines
with logtape-style `{placeholders}` interpolated from the kv record.
`lowestLevel` is `'debug'`, `'info'` (default) or `'error'` — e.g. pass
`'debug'` to see factory timings, or `'error'` to keep stdout quiet.

### `createLogtapeLogger(category?)`

Creates a [logtape](https://logtape.org)-backed `Logger` for structured
logging (category `'app'` unless specified).

> ⚠️ Logtape is **silent until configured** — set up a sink to see output:

```ts
import { configure, getConsoleSink } from '@logtape/logtape';

await configure({
  sinks: { console: getConsoleSink() },
  loggers: [
    { category: 'app', sinks: ['console'], lowestLevel: 'debug' },
    { category: ['logtape', 'meta'], sinks: [] },
  ],
});
```

### `createContainerHooks(logger)`

Builds the iocc `ContainerHooks` the app installs on its container — logs
registrations, resolutions, factory timings, cache hits and errors with kv
properties:

```
[info] Component Greeter registered
[info] Token Greeter resolved
```

Events for the built-in components and tokens (`AbortControllerComp`,
`AbortSignaler`, `Aborter`, `IStarter`, `IStopper`) are filtered out so app
logs only show user components; errors are never filtered.

Exported so you can reuse the same observability on a standalone `Container`.

### `Result` / `Ok` / `Err`

A minimal discriminated-union result type:

```ts
import { Ok, Err, type Result } from '@litemw/kit';

function parse(input: string): Result<number, string> {
  const n = Number(input);
  return Number.isNaN(n) ? Err('not a number') : Ok(n);
}

const res = parse('42');
if (res.ok) {
  res.value; // number
} else {
  res.error; // string
}
```

`Logger.error()` takes an `Err<unknown>` so failures are always structured.

## 📄 License

MIT
