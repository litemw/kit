import { App } from "../lib";

// The most primitive app: no components at all. It still owns a container
// with the built-in abort components and runs the full lifecycle. Logs go
// to the console out of the box; internal components are not logged.
const app = new App();

await app.start();
await app.run(); // blocks until Ctrl+C / SIGTERM
