import { defComp } from "@litemw/iocc";
import { Aborter, AbortSignaler, App, IStarter } from "../lib";

// Every app owns a single AbortController exposed via two components:
// AbortSignaler resolves to its AbortSignal, Aborter to its bound abort().
// This wires app-wide cancellation without passing controllers around.
const Worker = defComp("Worker")
  .provide(AbortSignaler)
  .as(IStarter)
  .build((signal) => ({
    onStart() {
      const timer = setInterval(() => console.log("working..."), 250);
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        console.log(`worker cancelled, reason: ${signal.reason}`);
      });
    },
  }));

const app = new App({ components: [Worker] });

await app.start();

// Any component (or outside code) can resolve Aborter and cancel the app.
// app.stop() aborts the same signal with AbortReason.Stopped.
const abort = await app.container.get(Aborter);
setTimeout(() => abort("deadline reached"), 1000);

// run() blocks until the signal aborts (or a SIGINT/SIGTERM arrives).
await app.run();
