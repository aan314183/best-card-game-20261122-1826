// main.ts — entry program for the EMBER DUEL card game.
// Copies game/ and screenshots/ into the output directory and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Runs on Node 22 with the standard library only; no network, no install.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`main.ts: missing ${name}/ in the repository`);
  cpSync(src, dst, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, 'game'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
copyTree('game');
copyTree('screenshots');

const dossier = buildDossier(outDir, caps);
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Verify the write: the dossier must read back as JSON with the expected
// schema, and the copied game must contain its entry point.
const readBack = JSON.parse(readFileSync(join(outDir, 'dossier.json'), 'utf8')) as { schema?: string };
if (readBack.schema !== 'makefun/dossier/v1') throw new Error('main.ts: dossier schema mismatch after write');
if (!existsSync(join(outDir, 'game', 'index.html'))) throw new Error('main.ts: game/index.html missing from output');
const shotNames = readdirSync(join(outDir, 'screenshots'));
if (shotNames.length < 3 || shotNames.length > 4) throw new Error(`main.ts: expected 3-4 screenshots, found ${shotNames.length}`);
console.log(`main.ts: wrote ${outDir}/dossier.json (${dossier.length} bytes), ${shotNames.length} screenshots`);
