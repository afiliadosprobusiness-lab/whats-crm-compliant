import "dotenv/config";
import { createApp } from "./app.js";

const { app, env } = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${env.port}`);
});

