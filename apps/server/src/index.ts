import { cors } from "@elysiajs/cors";
import { auth } from "@risk-matrix/auth";
import { env } from "@risk-matrix/env/server";
import { db } from "@risk-matrix/db";
import { eq } from "drizzle-orm";
import {
  matrixTemplates,
  cellMappings,
  cellTypes,
} from "@risk-matrix/db/schema/matrix";
import { Elysia, t } from "elysia";

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .all("/api/auth/*", async (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })

  // s'éxécute a chaque apel de route
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    return { session };
  })

  .group("/matrix", (app) =>
    app
      .onBeforeHandle(({ session, set }) => {
        if (!session) {
          // set (Elysia) = controle réponses http (set.status, set.headers, set.body...)
          set.status = 401;
          return "Unauthorized";
        }
      })

      .get("/all", async () => {
        const templates = await db.select().from(matrixTemplates);

        const fullMatrices = await Promise.all(
          // Pour chaque template, récup les mappings
          templates.map(async (tpl) => {
            const mappings = await db
              .select({
                x: cellMappings.x,
                y: cellMappings.y,
                color: cellTypes.color,
                cellTypeId: cellTypes.id,
              })
              .from(cellMappings)
              .innerJoin(cellTypes, eq(cellMappings.cellTypeId, cellTypes.id))

              // récupe les cell a la matrice
              .where(eq(cellMappings.templateId, tpl.id));

            // transforme mappings en ["x-y"]
            const cells: Record<string, string> = {};
            mappings.forEach((m) => {
              cells[`${m.x}-${m.y}`] = m.cellTypeId.toString();
            });

            // créer un tableau avec id et couleur des risques
            const riskLevels = Array.from(
              new Map(
                mappings.map((m) => [
                  m.cellTypeId,
                  { id: m.cellTypeId.toString(), color: m.color },
                ]),
              ).values(),
            );

            return {
              ...tpl,
              cells,
              riskLevels,
            };
          }),
        );

        return fullMatrices;
      })

      .get(
        "/:id",
        async ({ params: { id }, set }) => {
          const template = await db
            .select()
            .from(matrixTemplates)
            .where(eq(matrixTemplates.id, Number(id)))
            .then((res) => res[0]);

          if (!template) {
            set.status = 404;
            return "Matrix not found";
          }

          const mappings = await db
            .select({
              x: cellMappings.x,
              y: cellMappings.y,
              color: cellTypes.color,
              title: cellTypes.title,
              cellTypeId: cellTypes.id,
            })
            .from(cellMappings)
            .innerJoin(cellTypes, eq(cellMappings.cellTypeId, cellTypes.id))
            .where(eq(cellMappings.templateId, template.id));

          const cells: Record<string, string> = {};
          const riskLevelsMap = new Map();


          // Transforme les mappings en format ({"x-y": cellTypeId})
          mappings.forEach((m) => {
            cells[`${m.x}-${m.y}`] = m.cellTypeId.toString();
            
            // Renvoie true si la clé est présente
            if (!riskLevelsMap.has(m.cellTypeId)) {
              riskLevelsMap.set(m.cellTypeId, {
                id: m.cellTypeId.toString(),
                label: m.title,
                color: m.color,
              });
            }
          });

          return {
            ...template,
            cells,
            riskLevels: Array.from(riskLevelsMap.values()),
          };
        },
        {
          params: t.Object({ id: t.String() }),
        },
      )

      .post(
        "/create",
        async ({ body }) => {
          return await db.transaction(async (tx) => {
            const [template] = await tx
              .insert(matrixTemplates)
              .values({
                name: body.name,
                size: body.size,
                xTitle: body.xTitle,
                yTitle: body.yTitle,
              })

              // renvoie l'objet template (on sait que c réussi)
              .returning();

            // tx = si un truc marche pas, annule tout (transaction)
            // insère les risques et récupe les ids
            const insertedTypes = await tx
              .insert(cellTypes)
              .values(
                body.riskLevels.map((rl) => ({
                  title: rl.label,
                  color: rl.color,
                  icon: "default",
                })),
              )
              .returning();

            // création dictionnaire - trouver l'index (O(1))
            const riskLevelMap = new Map(
              body.riskLevels.map((rl, index) => [rl.id, index]),
            );

            // transforme en tableau
            const cellsToInsert = Object.entries(body.matrixData).map(
              ([key, levelId]) => {
                // "1-5" => [1, 5] (split transforme string en array)
                const [x, y] = key.split("-").map(Number);

                // (avant: findIndex - trop d'opérations) trouve index risque pour chaque cellule
                const typeIndex = riskLevelMap.get(levelId);

                // si l'id existe pas (dans le dictionnaire)
                if (typeIndex === undefined) {
                  throw new Error(`Niveau de risque invalide : ${levelId}`);
                }

                return {
                  templateId: template.id,
                  cellTypeId: insertedTypes[typeIndex].id,
                  x,
                  y,
                };
              },
            );

            if (cellsToInsert.length > 0) {
              await tx.insert(cellMappings).values(cellsToInsert);
            }

            return template;
          });
        },
        // schema validation (t = TypeBox - natif a Elysia)
        {
          body: t.Object({
            name: t.String(),
            size: t.Number(),
            xTitle: t.String(),
            yTitle: t.String(),
            riskLevels: t.Array(
              t.Object({
                id: t.String(),
                label: t.String(),
                color: t.String(),
              }),
            ),
            matrixData: t.Record(t.String(), t.String()),
          }),
        },
      )

      .put(
        "/:id",
        async ({ params: { id }, body, set }) => {
          return await db.transaction(async (tx) => {
            const templateId = Number(id);

            const [updatedTemplate] = await tx
              .update(matrixTemplates)
              .set({
                name: body.name,
                size: body.size,
                xTitle: body.xTitle,
                yTitle: body.yTitle,
              })
              .where(eq(matrixTemplates.id, templateId))
              .returning();

            if (!updatedTemplate) {
              set.status = 404;
              throw new Error("Matrice introuvable");
            }

            await tx
              .delete(cellMappings)
              .where(eq(cellMappings.templateId, templateId));

            const insertedTypes = await tx
              .insert(cellTypes)
              .values(
                body.riskLevels.map((rl) => ({
                  title: rl.label,
                  color: rl.color,
                  icon: "default",
                })),
              )
              .returning();

            const riskLevelMap = new Map(
              body.riskLevels.map((rl, index) => [rl.id, index]),
            );

            // transforme en tableau
            const cellsToInsert = Object.entries(body.matrixData).map(
              ([key, levelId]) => {
                const [x, y] = key.split("-").map(Number);
                const typeIndex = riskLevelMap.get(levelId);

                if (typeIndex === undefined) {
                  throw new Error(`Niveau de risque invalide : ${levelId}`);
                }

                return {
                  templateId: templateId,
                  cellTypeId: insertedTypes[typeIndex].id,
                  x,
                  y,
                };
              },
            );

            if (cellsToInsert.length > 0) {
              await tx.insert(cellMappings).values(cellsToInsert);
            }

            return updatedTemplate;
          });
        },
        {

          // validation schema
          params: t.Object({ id: t.String() }),
          body: t.Object({
            name: t.String(),
            size: t.Number(),
            xTitle: t.String(),
            yTitle: t.String(),
            riskLevels: t.Array(
              t.Object({
                id: t.String(),
                label: t.String(),
                color: t.String(),
              }),
            ),

            // Record = object clé valeur, sert comme dictionnaire (si on ne connait pas les clés a l'avance)
            matrixData: t.Record(t.String(), t.String()),
          }),
        },
      ),
  )
  .get("/", () => "OK");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export type App = typeof app;
