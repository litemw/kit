import { defComp, defIntf } from "@litemw/iocc";
import { configure, getConsoleSink } from "@logtape/logtape";
import { App, createModule, IStarter, IStopper } from "../lib";

// Domain service exposed through the container.
type Greeter = {
  greet(name: string): string;
};

const IGreeter = defIntf<Greeter>("Greeter");

const GreeterComponent = defComp("greeter")
  .as(IGreeter)
  .build(() => ({
    greet: (name: string) => `Hello, ${name}!`,
  }));

// Lifecycle component: greets on start, says goodbye on stop.
const GreetOnStart = defComp("greetOnStart")
  .provide(IGreeter)
  .as(IStarter)
  .as(IStopper)
  .build((greeter) => ({
    onStart() {
      console.log(greeter.greet("world"));
    },
    onStop() {
      console.log("Goodbye!");
    },
  }));

// The app logs through logtape by default, so configure a sink to see output.
await configure({
  sinks: {
    console: getConsoleSink(),
  },
  loggers: [
    { category: "app", sinks: ["console"], lowestLevel: "info" },
    { category: ["logtape", "meta"], sinks: [] },
  ],
});

const app = new App({
  modules: [createModule(GreeterComponent, GreetOnStart)],
});

await app.start();
await app.stop();
