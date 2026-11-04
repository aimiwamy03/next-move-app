import { randomBytes, scryptSync } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

import resourceGuides from "../../../content/resource-guides.json";

import { getDatabase, withImmediateTransaction } from "./client";

export const DEMO_USER_ID = "demo-andre";
export const DEMO_CONVERSATION_ID = "demo-andre-web";

type SeedOptions = {
  pin?: string;
  phoneNumber?: string;
};

const tasks = [
  {
    id: "release-id-receipt", title: "Collect an ID or DMV receipt",
    description: "Keep any state ID, driver’s license, or DMV receipt received before release.",
    phase: "Release day", phaseOrder: 1, priority: 108, minutes: 5,
    initialStatus: "not_started",
  },
  {
    id: "trust-funds", title: "Collect trust or commissary funds",
    description: "Confirm that cash, a check, or a release card is accounted for.",
    phase: "Release day", phaseOrder: 1, priority: 107, minutes: 5,
    initialStatus: "not_started",
  },
  {
    id: "medication-bridge", title: "Get medical records and bridge medication",
    description: "Keep discharge medical information and enough medication to reach a community provider.",
    phase: "Release day", phaseOrder: 1, priority: 106, minutes: 15,
    initialStatus: "not_started",
  },
  {
    id: "release-papers", title: "Keep release or discharge papers",
    description: "Store the official release documents somewhere safe and reachable.",
    phase: "Release day", phaseOrder: 1, priority: 105, minutes: 5,
    initialStatus: "not_started",
  },
  {
    id: "mailing-address", title: "Make sure you have a mailing address",
    description: "Have a safe, reliable place where important documents and benefit letters can arrive.",
    phase: "Release day", phaseOrder: 1, priority: 109, minutes: 10,
    initialStatus: "not_started",
  },
  {
    id: "destination-ride", title: "Confirm a destination and ride",
    description: "Know where the first night will be and how to get there safely.",
    phase: "Release day", phaseOrder: 1, priority: 103, minutes: 10,
    initialStatus: "not_started",
  },
  {
    id: "phone-access", title: "Set up a working phone",
    description: "Confirm a reliable number or start a California LifeLine application.",
    phase: "Release day", phaseOrder: 1, priority: 102, minutes: 20,
    initialStatus: "not_started",
  },
  {
    id: "supervision-contact", title: "Know the first supervision check-in",
    description: "Save the parole or probation contact, location, date, and time if supervision applies.",
    phase: "Release day", phaseOrder: 1, priority: 101, minutes: 10,
    initialStatus: "not_started",
  },
  {
    id: "basic-needs-first-night", title: "Eat, hydrate, and find safe sleep",
    description: "Cover food, water, and a safe place to sleep before less urgent paperwork.",
    phase: "Release day", phaseOrder: 1, priority: 100, minutes: 15,
    initialStatus: "not_started",
  },
  {
    id: "report-supervision", title: "Report to parole or probation",
    description: "Bring release papers and complete the first required check-in if supervision applies.",
    phase: "First week", phaseOrder: 2, priority: 95, minutes: 45,
    initialStatus: "not_applicable",
  },
  {
    id: "birth-certificate", title: "Request a birth certificate",
    description: "Request an authorized certified copy for identification and other official uses.",
    phase: "First week", phaseOrder: 2, priority: 94, minutes: 20,
    initialStatus: "not_started",
  },
  {
    id: "social-security-card", title: "Replace a Social Security card if needed",
    description: "Check whether a replacement card is needed and start the Social Security process.",
    phase: "First week", phaseOrder: 2, priority: 91, minutes: 25,
    initialStatus: "not_started",
  },
  {
    id: "apply-benefits", title: "Apply or restart essential benefits",
    description: "Start the relevant CalFresh, Medi-Cal, SSI, or SSDI applications.",
    phase: "First week", phaseOrder: 2, priority: 90, minutes: 30,
    initialStatus: "not_started",
  },
  {
    id: "health-care-refills", title: "Connect with health care and refill medication",
    description: "Find a community provider and prevent a gap in necessary prescriptions.",
    phase: "First week", phaseOrder: 2, priority: 89, minutes: 30,
    initialStatus: "not_started",
  },
  {
    id: "housing-plan", title: "Plan housing beyond the first nights",
    description: "Identify the next stable option and a backup if that option changes.",
    phase: "First week", phaseOrder: 2, priority: 88, minutes: 30,
    initialStatus: "not_started",
  },
  {
    id: "county-reentry-services", title: "Connect with county reentry services",
    description: "Contact a reentry hub, one-stop center, or navigator for coordinated help.",
    phase: "First week", phaseOrder: 2, priority: 87, minutes: 20,
    initialStatus: "not_started",
  },
  {
    id: "family-contact", title: "Reconnect with supportive people on your terms",
    description: "Choose one safe person and set boundaries for how you want to reconnect.",
    phase: "First week", phaseOrder: 2, priority: 75, minutes: 10,
    initialStatus: "not_started",
  },
  {
    id: "state-id", title: "Apply for a state ID",
    description: "Use identity and residency documents to apply for a California identification card.",
    phase: "First week", phaseOrder: 2, priority: 93, minutes: 30,
    initialStatus: "not_started",
  },
  {
    id: "job-readiness", title: "Prepare for a job search",
    description: "Create a simple resume, check transportation and clothing needs, and choose one fair-chance job lead.",
    phase: "Weeks 2–4", phaseOrder: 3, priority: 82, minutes: 30,
    initialStatus: "not_started",
  },
  {
    id: "bank-account", title: "Open a bank account if useful",
    description: "Compare low-fee options and gather the identification the bank requires.",
    phase: "Weeks 2–4", phaseOrder: 3, priority: 77, minutes: 30,
    initialStatus: "not_started",
  },
  {
    id: "required-programs", title: "Schedule required supervision programs",
    description: "Record required classes, treatment, testing, or appointments and their deadlines.",
    phase: "Weeks 2–4", phaseOrder: 3, priority: 81, minutes: 20,
    initialStatus: "not_applicable",
  },
  {
    id: "support-routine", title: "Build a mental-health and support routine",
    description: "Choose a counselor, peer group, mentor, Sangha, or other steady support.",
    phase: "Weeks 2–4", phaseOrder: 3, priority: 80, minutes: 20,
    initialStatus: "not_started",
  },
  {
    id: "update-bfp", title: "Update a BFP community coordinator",
    description: "Share current needs and progress if you are connected with a coordinator.",
    phase: "Weeks 2–4", phaseOrder: 3, priority: 70, minutes: 10,
    initialStatus: "not_started",
  },
  {
    id: "daily-routine", title: "Create a simple daily routine",
    description: "Choose a realistic rhythm for sleep, meals, appointments, and a short grounding practice.",
    phase: "Weeks 2–4", phaseOrder: 3, priority: 79, minutes: 15,
    initialStatus: "not_started",
  },
  {
    id: "review-plan", title: "Review the reentry plan",
    description: "Look back at what is complete, waiting, blocked, or no longer needed.",
    phase: "Day 30 and beyond", phaseOrder: 4, priority: 65, minutes: 15,
    initialStatus: "not_started",
  },
  {
    id: "identify-gaps", title: "Name the remaining gaps",
    description: "Choose the one missing document, benefit, appointment, or support that matters most now.",
    phase: "Day 30 and beyond", phaseOrder: 4, priority: 64, minutes: 10,
    initialStatus: "not_started",
  },
  {
    id: "stay-connected", title: "Stay connected to a support network",
    description: "Keep at least one recurring connection with a trusted person, group, or program.",
    phase: "Day 30 and beyond", phaseOrder: 4, priority: 63, minutes: 10,
    initialStatus: "not_started",
  },
  {
    id: "know-who-to-call", title: "Keep a short who-to-call list",
    description: "Save contacts for urgent needs, supervision, health care, benefits, and trusted support.",
    phase: "Day 30 and beyond", phaseOrder: 4, priority: 62, minutes: 10,
    initialStatus: "not_started",
  },
] as const;

const dependencies = [
  ["birth-certificate", "mailing-address"], ["birth-certificate", "release-papers"],
  ["state-id", "birth-certificate"],
  ["social-security-card", "release-papers"],
  ["health-care-refills", "medication-bridge"],
  ["job-readiness", "state-id"], ["job-readiness", "phone-access"],
  ["bank-account", "state-id"],
  ["identify-gaps", "review-plan"],
] as const;

const resources = resourceGuides;

function pinDigest(pin: string, salt: string): string {
  return scryptSync(pin, salt, 64).toString("hex");
}

export function seedDemoData(options: SeedOptions = {}): void {
  const pin = options.pin ?? process.env.DEMO_PIN;
  if (!pin || !/^\d{4}$/.test(pin)) {
    throw new Error("DEMO_PIN must be set to exactly four digits before seeding");
  }

  const phoneNumber =
    options.phoneNumber ?? process.env.DEMO_PHONE_E164 ?? "+14155550123";
  if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw new Error("DEMO_PHONE_E164 must be a valid E.164 phone number");
  }

  const now = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const hash = pinDigest(pin, salt);

  withImmediateTransaction((db) => {
    db.prepare(`
      INSERT INTO users (id, phone_e164, preferred_name, timezone, state, county, created_at)
      VALUES (?, ?, 'Andre', 'America/Los_Angeles', 'CA', 'Los Angeles', ?)
      ON CONFLICT(id) DO UPDATE SET
        phone_e164 = excluded.phone_e164,
        preferred_name = excluded.preferred_name,
        timezone = excluded.timezone,
        state = excluded.state,
        county = excluded.county
    `).run(DEMO_USER_ID, phoneNumber, now);

    db.prepare(`
      INSERT INTO pin_credentials (user_id, pin_hash, salt, failed_attempts, locked_until, updated_at)
      VALUES (?, ?, ?, 0, NULL, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        pin_hash = excluded.pin_hash,
        salt = excluded.salt,
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = excluded.updated_at
    `).run(DEMO_USER_ID, hash, salt, now);

    db.prepare(`
      INSERT INTO conversations (id, user_id, channel, created_at, updated_at)
      VALUES (?, ?, 'web', ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).run(DEMO_CONVERSATION_ID, DEMO_USER_ID, now, now);

    const upsertTask = db.prepare(`
      INSERT INTO task_templates
        (id, title, description, base_priority, estimated_minutes, initial_status,
         phase, phase_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        base_priority = excluded.base_priority,
        estimated_minutes = excluded.estimated_minutes,
        initial_status = excluded.initial_status,
        phase = excluded.phase,
        phase_order = excluded.phase_order
    `);
    const ensureUserTask = db.prepare(`
      INSERT INTO user_tasks (user_id, task_id, status, completed_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, task_id) DO NOTHING
    `);
    for (const task of tasks) {
      upsertTask.run(
        task.id,
        task.title,
        task.description,
        task.priority,
        task.minutes,
        task.initialStatus,
        task.phase,
        task.phaseOrder,
      );
      ensureUserTask.run(
        DEMO_USER_ID,
        task.id,
        task.initialStatus,
        null,
      );
    }

    const addDependency = db.prepare(`
      INSERT INTO task_dependencies (task_id, prerequisite_task_id)
      VALUES (?, ?)
      ON CONFLICT(task_id, prerequisite_task_id) DO NOTHING
    `);
    const taskIds = tasks.map((task) => task.id);
    db.prepare(`
      DELETE FROM task_dependencies
      WHERE task_id IN (${taskIds.map(() => "?").join(", ")})
    `).run(...taskIds);
    for (const [taskId, prerequisiteId] of dependencies) {
      addDependency.run(taskId, prerequisiteId);
    }

    db.prepare(`
      INSERT INTO practice_catalog
        (practice_id, title, duration_seconds, path, fallback_text)
      VALUES (
        'three-breaths-60s',
        'Three Intentional Breaths',
        60,
        '/practice/three-breaths-60s',
        'Put both feet down and take three slow, comfortable breaths.'
      )
      ON CONFLICT(practice_id) DO UPDATE SET
        title = excluded.title,
        duration_seconds = excluded.duration_seconds,
        path = excluded.path,
        fallback_text = excluded.fallback_text
    `).run();

    const upsertResource = db.prepare(`
      INSERT INTO resource_documents
        (id, title, summary, category, jurisdiction, source_uri, phone, url,
         address, reviewed_at, search_text, guide_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        category = excluded.category,
        jurisdiction = excluded.jurisdiction,
        source_uri = excluded.source_uri,
        phone = excluded.phone,
        url = excluded.url,
        address = excluded.address,
        reviewed_at = excluded.reviewed_at,
        search_text = excluded.search_text,
        guide_json = excluded.guide_json
    `);
    for (const resource of resources) {
      upsertResource.run(
        resource.id,
        resource.title,
        resource.summary,
        resource.category,
        resource.jurisdiction,
        resource.sourceUri,
        resource.phone ?? null,
        resource.url ?? null,
        resource.address ?? null,
        resource.reviewedAt,
        resource.searchText,
        JSON.stringify({
          aliases: resource.aliases,
          switchAliases: resource.switchAliases,
          steps: resource.steps,
          requirements: resource.requirements,
          notes: resource.notes,
        }),
      );
    }

    const currentResourceIds = resources.map((resource) => resource.id);
    db.prepare(`
      DELETE FROM resource_documents
      WHERE id LIKE 'demo-%'
        AND id NOT IN (${currentResourceIds.map(() => "?").join(", ")})
    `).run(...currentResourceIds);
    db.prepare("DELETE FROM retrieval_records WHERE id LIKE 'demo-resource:%'").run();
  });
}

export function resetDemoData(db: DatabaseSync = getDatabase()): void {
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM outbound_messages WHERE user_id = ?").run(DEMO_USER_ID);
    db.prepare(`
      DELETE FROM messages
      WHERE conversation_id = ?
    `).run(DEMO_CONVERSATION_ID);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(DEMO_USER_ID);
    db.prepare("DELETE FROM participant_memories WHERE user_id = ?").run(
      DEMO_USER_ID,
    );
    db.prepare(`
      UPDATE user_tasks
      SET status = (
        SELECT initial_status FROM task_templates WHERE id = user_tasks.task_id
      ),
      started_at = NULL,
      completed_at = CASE
        WHEN (SELECT initial_status FROM task_templates WHERE id = user_tasks.task_id) = 'completed'
        THEN ? ELSE NULL END
      WHERE user_id = ?
    `).run(now, DEMO_USER_ID);
    db.prepare(`
      UPDATE pin_credentials
      SET failed_attempts = 0, locked_until = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(now, DEMO_USER_ID);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
