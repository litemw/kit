import { defComp } from "@litemw/iocc";
import { App, IStarter, IStopper } from "../lib";

// IStarter / IStopper are multi tokens: every component registered under
// them gets its hook called by app.start() / app.stop(). Hooks can be
// sync or async.
const Server = defComp("Server")
  .as(IStarter)
  .as(IStopper)
  .build(() => ({
    async onStart() {
      console.log("server listening");
    },
    async onStop() {
      console.log("server closed");
    },
  }));

// A component can implement just one of the hooks.
const Migrations = defComp("Migrations")
  .as(IStarter)
  .build(() => ({
    onStart() {
      console.log("migrations applied");
    },
  }));

const app = new App({ components: [Server, Migrations] });

await app.start(); // runs every IStarter
await app.stop(); // runs every IStopper
