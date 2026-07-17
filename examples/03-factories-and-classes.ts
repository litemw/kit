import { defComp } from "@litemw/iocc";
import { App } from "../lib";

// Components don't have to be built from inline closures — any existing
// factory function or class fits build(), so third-party constructors can
// be wired into the container without wrappers around your domain code.
const Config = defComp("Config").build(() => ({
  url: "db://localhost",
}));

// 1. An external factory: resolved dependencies are passed to it in
// provide() order, so a matching signature can be plugged in directly.
type Pool = {
  query(sql: string): string;
};

function createPool(config: { url: string }): Pool {
  return {
    query: (sql) => `[${config.url}] ${sql}`,
  };
}

const PoolComponent = defComp("Pool").provide(Config).build(createPool);

// 2. A class: wrap the constructor in a factory that news it up.
class UserService {
  constructor(private readonly pool: Pool) {}

  list(): string {
    return this.pool.query("SELECT * FROM users");
  }
}

const UserServiceComponent = defComp("UserService")
  .provide(PoolComponent)
  .build((pool) => new UserService(pool));

const app = new App({
  components: [Config, PoolComponent, UserServiceComponent],
});

const users = await app.container.get(UserServiceComponent);
console.log(users.list());
