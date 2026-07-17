import { defComp, defIntf } from "@litemw/iocc";
import { App, createModule, IStarter } from "../lib";

// A module is a named group of components — a unit of composition.
// Components from different modules see each other through the shared
// container, so modules can depend on each other's interfaces.
type UserRepository = {
  find(id: number): string;
};

const IUserRepository = defIntf<UserRepository>("UserRepository");

const PostgresUserRepository = defComp("PostgresUserRepository")
  .as(IUserRepository)
  .build(() => ({
    find: (id: number) => `user #${id} from postgres`,
  }));

const storageModule = createModule("storage", PostgresUserRepository);

const HttpServer = defComp("HttpServer")
  .provide(IUserRepository)
  .as(IStarter)
  .build((users) => ({
    onStart() {
      console.log(`GET /users/1 -> ${users.find(1)}`);
    },
  }));

const httpModule = createModule("http", HttpServer);

// Apps are composed from modules; standalone components can be mixed in
// via the components list.
const app = new App({ modules: [storageModule, httpModule] });

await app.start();
await app.stop();
