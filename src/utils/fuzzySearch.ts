export interface FuzzyKeyOption {
  name: string;
  weight?: number;
}

export interface FuzzyIndexOptions {
  keys: FuzzyKeyOption[];
  /**
   * Maximum normalized distance allowed between the query and a candidate.
   * 0 means an exact match only, 1 allows any match. Defaults to 0.6.
   */
  threshold?: number;
  /**
   * Minimum query length required before fuzzy matching runs. Defaults to 2.
   */
  minMatchCharLength?: number;
}

export interface FuzzySearchResult<T> {
  item: T;
  refIndex: number;
  score: number;
}

interface WeightedScore {
  score: number;
  weight: number;
}

function normalizeRecord(record: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    normalized[key] = value?.toString().trim() ?? "";
  }
  return normalized;
}

function normalizedDistance(a: string, b: string): number {
  if (!a && !b) {
    return 0;
  }
  if (!a || !b) {
    return 1;
  }
  if (a === b) {
    return 0;
  }
  const matrix: number[][] = [];
  const rows = a.length + 1;
  const cols = b.length + 1;

  for (let row = 0; row < rows; row += 1) {
    matrix[row] = [row];
  }

  for (let col = 1; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      if (a[row - 1] === b[col - 1]) {
        matrix[row][col] = matrix[row - 1][col - 1];
        continue;
      }
      const deletion = matrix[row - 1][col] + 1;
      const insertion = matrix[row][col - 1] + 1;
      const substitution = matrix[row - 1][col - 1] + 1;
      matrix[row][col] = Math.min(deletion, insertion, substitution);
    }
  }

  const distance = matrix[rows - 1][cols - 1];
  const maxLength = Math.max(a.length, b.length, 1);
  return distance / maxLength;
}

function tokenDistance(candidate: string, query: string): number {
  const normalizedCandidate = candidate.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (!normalizedCandidate) {
    return 1;
  }
  if (normalizedCandidate.includes(normalizedQuery)) {
    // Exact substring match — treat as best possible score.
    return 0;
  }

  const tokens = normalizedCandidate.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!tokens.length) {
    return normalizedDistance(normalizedCandidate, normalizedQuery);
  }

  let best = 1;
  for (const token of tokens) {
    const score = normalizedDistance(token, normalizedQuery);
    if (score < best) {
      best = score;
      if (best === 0) {
        break;
      }
    }
  }
  return best;
}

export class FuzzyIndex<T extends Record<string, string>> {
  private readonly list: T[];

  private readonly options: Required<Omit<FuzzyIndexOptions, "keys">> & { keys: FuzzyKeyOption[] };

  constructor(list: T[], options: FuzzyIndexOptions) {
    if (!options.keys?.length) {
      throw new Error("FuzzyIndex requires at least one key");
    }
    this.list = list.map((item) => normalizeRecord(item));
    this.options = {
      keys: options.keys,
      threshold: options.threshold ?? 0.6,
      minMatchCharLength: options.minMatchCharLength ?? 2,
    };
  }

  search(query: string): FuzzySearchResult<T>[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < this.options.minMatchCharLength) {
      return [];
    }

    const results: FuzzySearchResult<T>[] = [];
    this.list.forEach((item, index) => {
      const scores: WeightedScore[] = [];

      for (const keyOption of this.options.keys) {
        const weight = keyOption.weight ?? 1;
        const value = item[keyOption.name];
        if (!value) {
          continue;
        }
        const score = tokenDistance(value, normalizedQuery);
        scores.push({ score, weight });
      }

      if (!scores.length) {
        return;
      }

      const weightedScore =
        scores.reduce((total, entry) => total + entry.score * entry.weight, 0) /
        scores.reduce((total, entry) => total + entry.weight, 0);

      if (weightedScore <= this.options.threshold) {
        results.push({
          item: item as T,
          refIndex: index,
          score: weightedScore,
        });
      }
    });

    results.sort((a, b) => a.score - b.score || a.refIndex - b.refIndex);
    return results;
  }
}
