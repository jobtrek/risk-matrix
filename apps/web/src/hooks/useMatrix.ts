import { treaty } from "@elysiajs/eden";

import type { App } from "../../../server/src/index";

// treaty transforme api en objet js typé (a la place de fetch/axios)
// on peut (depuis api.) accéder à /matrix, /auth car lit le type App du serveur
const client = treaty<App>("http://localhost:3000", {
    fetch: {
        // force envoie de cookies (stocké dans navigateur pour envoyer au serveur)
        credentials: "include",
    }
});

export const api = client;
