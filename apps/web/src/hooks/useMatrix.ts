import { treaty } from "@elysiajs/eden";

import type { App } from "../../../server/src/index";

const serverUrl = import.meta.env.VITE_SERVER_URL;

if (!serverUrl) {
  throw new Error("VITE_SERVER_URL not found");
}

const client = treaty<App>(serverUrl, {
  fetch: {
    credentials: "include",
  },
});

export const api = client;
