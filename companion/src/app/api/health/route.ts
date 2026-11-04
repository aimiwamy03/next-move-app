import { NextResponse } from "next/server";

import { getDatabase } from "@/infrastructure/db/client";
import { DEMO_USER_ID } from "@/infrastructure/db/seed";
import { checkConfiguredConversationModels } from "@/modules/model";
import { getPracticeCatalog } from "@/modules/practices";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const db = getDatabase();
    const user = db.prepare("SELECT COUNT(*) AS count FROM users WHERE id = ?").get(
      DEMO_USER_ID,
    ) as { count: number };
    const resources = db.prepare(
      "SELECT COUNT(*) AS count FROM resource_documents",
    ).get() as { count: number };
    const tasks = db.prepare(
      "SELECT COUNT(*) AS count FROM task_templates",
    ).get() as { count: number };
    const allowedRetrievalStatuses =
      process.env.DEMO_MODE === "true" ? "'approved', 'demo_only'" : "'approved'";
    const retrieval = db.prepare(`
      SELECT COUNT(*) AS count FROM retrieval_records
      WHERE approval_status IN (${allowedRetrievalStatuses})
    `).get() as { count: number };
    const practices = getPracticeCatalog().practices.length;
    const model = await checkConfiguredConversationModels();
    const ready =
      user.count === 1 &&
      resources.count > 0 &&
      tasks.count > 0 &&
      retrieval.count > 0 &&
      practices > 0 &&
      model.ok;

    return NextResponse.json(
      {
        status: ready ? "ready" : "unavailable",
        checks: {
          database: { ok: true, severity: "required", detail: "SQLite is reachable." },
          seedUser: {
            ok: user.count === 1,
            severity: "required",
            detail: user.count === 1 ? "Andre is seeded." : "Andre has not been seeded.",
          },
          checklist: {
            ok: tasks.count > 0,
            severity: "required",
            detail: `${tasks.count} checklist tasks are available.`,
          },
          resources: {
            ok: resources.count > 0,
            severity: "required",
            detail: `${resources.count} reviewed action guides are available.`,
          },
          retrieval: {
            ok: retrieval.count > 0,
            severity: "required",
            detail:
              process.env.DEMO_MODE === "true"
                ? `${retrieval.count} approved or demo-only retrieval records are indexed.`
                : `${retrieval.count} approved retrieval records are indexed.`,
          },
          practices: {
            ok: practices > 0,
            severity: "required",
            detail: `${practices} text-first mindfulness practices are available.`,
          },
          model: {
            ok: model.ok,
            severity: "required",
            detail: model.detail,
          },
        },
      },
      { status: ready ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        checks: {
          database: {
            ok: false,
            severity: "required",
            detail: "SQLite could not be opened.",
          },
        },
      },
      { status: 503 },
    );
  }
}
