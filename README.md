# @litemw/kit

[![CI](https://github.com/litemw/kit/actions/workflows/ci.yml/badge.svg)](https://github.com/litemw/kit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@litemw/kit.svg)](https://www.npmjs.com/package/@litemw/kit)
[![coverage](https://codecov.io/github/litemw/kit/graph/badge.svg)](https://app.codecov.io/github/litemw/kit)
[![license](https://img.shields.io/npm/l/@litemw/kit.svg)](./LICENSE)

An application kit inspired by go/fx on top of [@litemw/iocc](https://github.com/litemw/iocc) — modules, lifecycle and structured logging for container-driven apps.

🧩 **Modular** — group components into modules and compose apps from them

🔄 **Lifecycle** — `IStarter`/`IStopper` hooks run on `app.start()` / `app.stop()`

📝 **Observable** — every container event (register, resolve, factory, cache) is logged

🪵 **Logtape-backed** — structured logging out of the box, swappable via the `Logger` interface

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

Runnable examples live in [`examples/`](./examples):

```sh
bun examples/basic.ts
```

## 📖 API

### `App`

```ts
const app = new App({
  modules,    // readonly Module[]    — groups of components
  components, // readonly Component[] — standalone components
  logger,     // Logger               — defaults to a logtape logger ('app' category)
});
```

The constructor creates a `Container` with logging hooks attached, then
registers every component from `modules` and `components`. The container is
available as `app.container`.

- `app.start()` — resolves all `IStarter` implementations and calls `onStart()` on each, in order
- `app.stop()` — resolves all `IStopper` implementations and calls `onStop()` on each, in order

If a hook throws, the error is logged and rethrown.

### `createModule(...components)`

Groups components into a module:

```ts
const userModule = createModule(UserRepository, UserService, UserController);

const app = new App({ modules: [userModule, authModule] });
```

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

### `createLogtapeLogger(category?)`

Creates the default [logtape](https://logtape.org)-backed `Logger`
(category `'app'` unless specified).

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
16:48:17.220 INF app Component greeter registered
16:48:17.221 INF app Token Greeter resolved
```

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
