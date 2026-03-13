import fs from "fs";
import path from "path";

const TOKEN = process.env.GITHUB_TOKEN!;
const OWNER = "Paridhi-Bhardwaj";
const REPO = "conversational-ai-dashboard";
const BRANCH = "main";

const IGNORE = new Set([
  "node_modules", ".git", "dist", ".turbo", "build", ".cache",
  "pnpm-lock.yaml", ".local", "attached_assets", "tsconfig.tsbuildinfo",
  "__pycache__", ".env"
]);

const IGNORE_EXTENSIONS = new Set([".lock"]);

function shouldIgnore(name: string): boolean {
  if (IGNORE.has(name)) return true;
  if (IGNORE_EXTENSIONS.has(path.extname(name))) return true;
  return false;
}

function getFiles(dir: string, base = ""): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath, relPath));
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        files.push({ path: relPath, content });
      } catch {
        // skip binary files
      }
    }
  }
  return files;
}

async function apiRequest(method: string, endpoint: string, body?: unknown) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API ${method} ${endpoint} failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

async function main() {
  const root = path.resolve(process.cwd());
  console.log(`Collecting files from ${root}...`);
  const files = getFiles(root);
  console.log(`Found ${files.length} files`);

  // Create blobs for all files
  console.log("Creating blobs...");
  const treeItems = [];
  let i = 0;
  for (const file of files) {
    i++;
    if (i % 20 === 0) console.log(`  ${i}/${files.length}...`);
    const blob = await apiRequest("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: Buffer.from(file.content).toString("base64"),
      encoding: "base64",
    });
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  // Get latest commit SHA to use as parent
  console.log("Fetching latest commit...");
  let parentSha: string | undefined;
  try {
    const ref = await apiRequest("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const refObj = ref.object as Record<string, string>;
    parentSha = refObj.sha;
  } catch {
    parentSha = undefined;
  }

  // Create tree
  console.log("Creating tree...");
  const treePayload: Record<string, unknown> = { tree: treeItems };
  if (parentSha) {
    const parentCommit = await apiRequest("GET", `/repos/${OWNER}/${REPO}/git/commits/${parentSha}`);
    treePayload.base_tree = (parentCommit.tree as Record<string, string>).sha;
  }
  const tree = await apiRequest("POST", `/repos/${OWNER}/${REPO}/git/trees`, treePayload);

  // Create commit
  console.log("Creating commit...");
  const commitPayload: Record<string, unknown> = {
    message: "Initial commit: Conversational AI Dashboard Generator",
    tree: tree.sha,
  };
  if (parentSha) commitPayload.parents = [parentSha];
  else commitPayload.parents = [];

  const commit = await apiRequest("POST", `/repos/${OWNER}/${REPO}/git/commits`, commitPayload);

  // Update or create branch ref
  console.log("Updating branch ref...");
  try {
    await apiRequest("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: commit.sha,
      force: true,
    });
  } catch {
    await apiRequest("POST", `/repos/${OWNER}/${REPO}/git/refs`, {
      ref: `refs/heads/${BRANCH}`,
      sha: commit.sha,
    });
  }

  console.log(`\n✅ Successfully pushed to https://github.com/${OWNER}/${REPO}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
