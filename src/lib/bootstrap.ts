/**
 * Bootstrap sobre casos (matched/goldens), mesmo algoritmo de
 * process-scorecards.js — reimplementado aqui pra poder recomputar o
 * intervalo client-side quando o usuário filtra a leaderboard por
 * linguagem/repo/tamanho (o CI publicado no leaderboard.json é sobre o
 * bench inteiro, não serve pra um subconjunto filtrado).
 *
 * PRNG determinístico (mulberry32): mesmo dado → mesmo intervalo, sempre.
 */
export function bootstrapCI(
  pairs: Array<[matched: number, goldens: number]>,
  iterations = 2000,
  seed = 42,
): { lo: number | null; hi: number | null } {
  if (!pairs.length) return { lo: null, hi: null };
  let s = seed;
  const rnd = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    let m = 0;
    let g = 0;
    for (let j = 0; j < pairs.length; j++) {
      const [mm, gg] = pairs[(rnd() * pairs.length) | 0];
      m += mm;
      g += gg;
    }
    samples.push(g ? (m / g) * 100 : 0);
  }
  samples.sort((a, b) => a - b);
  const at = (q: number) => samples[Math.min(samples.length - 1, Math.floor(q * samples.length))];
  return { lo: at(0.025), hi: at(0.975) };
}
