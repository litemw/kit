import { defComp, defIntf } from "@litemw/iocc";
import { App, createConsoleLogger, createModule } from "../lib";

// A small app wired to show every kind of graph edge: singular, multi and
// optional dependencies, interface implementations, and module clusters.
type Handler = {
  handle(path: string): void;
};

type Cache = {
  get(key: string): string | undefined;
};

const IHandler = defIntf<Handler>("Handler");
const ICache = defIntf<Cache>("Cache");

const Config = defComp("Config").build(() => ({ port: 3000 }));

const Database = defComp("Database")
  .provide(Config)
  .build((config) => ({ url: `db://localhost:${config.port}` }));

const UsersHandler = defComp("UsersHandler")
  .provide(Database)
  .as(IHandler.multi)
  .build((db) => ({
    handle: (path: string) => console.log(`users ${path} via ${db.url}`),
  }));

const HealthHandler = defComp("HealthHandler")
  .as(IHandler.multi)
  .build(() => ({
    handle: () => console.log("ok"),
  }));

// Depends on all handlers (multi) and on a cache that nobody registers
// (optional) — the graph renders these edges as `[]` and dotted `?`.
const Server = defComp("Server")
  .provide(Config, IHandler.multi, ICache.optional)
  .build(() => ({}));

const app = new App({
  modules: [
    createModule("http", Server, UsersHandler, HealthHandler),
    createModule("storage", Database),
  ],
  components: [Config],
  // Errors only — keeps stdout clean so it can be piped into a .dot file.
  logger: createConsoleLogger("error"),
});

// Render with Graphviz:
//   bun examples/09-graph.ts > graph.dot && dot -Tsvg graph.dot -o graph.svg
console.log(app.graph());
