import { defComp } from "@litemw/iocc";
import { configure, getConsoleSink } from "@logtape/logtape";
import { App, createLogtapeLogger, IStarter } from "../lib";

// The default logger writes plain lines to the console. For structured
// logging swap in the logtape adapter: configure a sink first — logtape
// stays silent until configured.
await configure({
  sinks: {
    console: getConsoleSink(),
  },
  loggers: [
    { category: "app", sinks: ["console"], lowestLevel: "debug" },
    { category: ["logtape", "meta"], sinks: [] },
  ],
});

const Server = defComp("Server")
  .as(IStarter)
  .build(() => ({
    onStart() {
      console.log("server listening");
    },
  }));

const app = new App({
  components: [Server],
  logger: createLogtapeLogger(), // 'app' category by default
});

await app.start();
await app.stop();
