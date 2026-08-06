import { promises as fs } from "fs";
import path from "path";

/**
 * 轻量 JSON 文件存储（无原生依赖，跨平台兼容）。
 * 库目录：/data（Docker volume 挂载点），本地开发用 ./.data
 */

const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.NODE_ENV === "production" ? "/data" : path.join(process.cwd(), ".data"));

const DB_FILE = path.join(DATA_DIR, "routecanvas-docs.json");

interface DocRecord {
  id: string;
  name: string;
  json: unknown;
  updatedAt: string;
}

export interface ShareRecord {
  id: string;
  name: string;
  json: unknown;
  createdAt: string;
  updatedAt: string;
}

interface DBShape {
  docs: Record<string, DocRecord>;
  shares: Record<string, ShareRecord>;
}

let cache: DBShape | null = null;

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function load(): Promise<DBShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DBShape>;
    cache = { docs: parsed.docs ?? {}, shares: parsed.shares ?? {} };
  } catch {
    cache = { docs: {}, shares: {} };
  }
  return cache!;
}

async function save(db: DBShape) {
  cache = db;
  await ensureDir();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export async function listDocs(): Promise<DocRecord[]> {
  const db = await load();
  return Object.values(db.docs).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getDoc(id: string): Promise<DocRecord | null> {
  const db = await load();
  return db.docs[id] ?? null;
}

export async function upsertDoc(
  id: string,
  name: string,
  json: unknown,
): Promise<DocRecord> {
  const db = await load();
  const record: DocRecord = {
    id,
    name,
    json,
    updatedAt: new Date().toISOString(),
  };
  db.docs[id] = record;
  await save(db);
  return record;
}

export async function deleteDoc(id: string): Promise<boolean> {
  const db = await load();
  if (!db.docs[id]) return false;
  delete db.docs[id];
  await save(db);
  return true;
}

export async function createShare(id: string, name: string, json: unknown): Promise<ShareRecord> {
  const db = await load();
  const now = new Date().toISOString();
  const record: ShareRecord = { id, name, json, createdAt: now, updatedAt: now };
  db.shares[id] = record;
  await save(db);
  return record;
}

export async function getShare(id: string): Promise<ShareRecord | null> {
  const db = await load();
  return db.shares[id] ?? null;
}
