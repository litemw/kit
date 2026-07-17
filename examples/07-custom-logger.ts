import { defComp } from "@litemw/iocc";
import { App, IStarter, type Logger } from "../lib";

// Any object implementing the Logger interface can replace the default
// console logger — the app and the container hooks will log through it.
// Messages use logtape-style {placeholders}, resolved from the kv record.
const fmt = (msg: string, kv?: Record<string, unknown>) =>
  msg.replace(/\{(\w+)\}/g, (_, key: string) => String(kv?.[key] ?? ""));

const logger: Logger = {
  debug(msg, kv) {
    console.debug(`[debug] ${fmt(msg, kv)}`);
  },
  info(msg, kv) {
    console.log(`[info] ${fmt(msg, kv)}`);
  },
  error(err, msg, kv) {
    console.error(`[error] ${fmt(msg, kv)}:`, err.error);
  },
};

const Unstable = defComp("Unstable")
  .as(IStarter)
  .build(() => ({
    onStart() {
      throw new Error("boom");
    },
  }));

const app = new App({ components: [Unstable], logger });

// Registration and resolution events above already went through the custom
// logger; the failing starter shows the error path too.
const result = await app.start();
console.log("start ok?", result.ok);
