import { defComp } from "@litemw/iocc";
import { App } from "../lib";

// A component is a named factory. Dependencies are declared with provide()
// and injected into the factory in the same order.
const Config = defComp("Config").build(() => ({
  greeting: "Hello",
}));

const Greeter = defComp("Greeter")
  .provide(Config)
  .build((config) => ({
    greet: (name: string) => `${config.greeting}, ${name}!`,
  }));

const app = new App({ components: [Config, Greeter] });

// Components resolve lazily through the container and are cached: the
// factory runs once, later gets return the same instance.
const greeter = await app.container.get(Greeter);
console.log(greeter.greet("world"));
