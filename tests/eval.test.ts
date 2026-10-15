// KPI report, not a pass/fail gate: prints how often we detect a game and get Teague's verdict right.
// Add real titles to fixtures/titles.json as you find them (especially ones that break the parser).
import { test } from 'vitest';
import fixtures from './fixtures/titles.json';
import data from '../data/teague.json';
import { matchGame } from '../src/core/matchGame';
import type { TeagueData } from '../src/core/types';

interface Fixture { title: string; uploadDate?: string; isGame: boolean; expected: string }

test('KPI eval', () => {
  let detected = 0;
  let correct = 0;
  const misses: string[] = [];
  for (const f of fixtures as Fixture[]) {
    const { verdict } = matchGame(f.title, f.uploadDate ?? null, data as TeagueData);
    const saysGame = verdict !== 'NOT_A_GAME';
    if (saysGame === f.isGame) detected++;
    if (verdict === f.expected) correct++;
    else misses.push(`  expected ${f.expected}, got ${verdict}: ${f.title}`);
  }
  const n = fixtures.length;
  console.log(
    `\nGame detection: ${detected}/${n} (${Math.round((100 * detected) / n)}%)` +
      `\nTeague verdict: ${correct}/${n} (${Math.round((100 * correct) / n)}%)` +
      (misses.length ? `\nMisses:\n${misses.join('\n')}` : ''),
  );
});
