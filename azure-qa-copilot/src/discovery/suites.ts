export interface SuiteRow {
  id: number;
  name: string;
  suiteType: string | undefined;
  parentId: number | undefined;
  requirementId: number | undefined;
  queryString: string | undefined;
  hasChildren: boolean | undefined;
  path: string;
  depth: number;
}

interface RawSuite {
  id?: number;
  name?: string;
  suiteType?: string;
  requirementId?: number;
  queryString?: string;
  hasChildren?: boolean;
  parentSuite?: { id?: number; name?: string };
  children?: RawSuite[];
}

/** Aceita árvore (children) ou lista plana (parentSuite); devolve linhas com caminho. */
export function flattenSuites(input: unknown): SuiteRow[] {
  const raw: RawSuite[] = Array.isArray(input) ? (input as RawSuite[]) : input ? [input as RawSuite] : [];
  const rows = new Map<number, SuiteRow>();
  const names = new Map<number, string>();
  const parents = new Map<number, number | undefined>();

  const visit = (s: RawSuite, parentId: number | undefined): void => {
    if (typeof s.id !== 'number') return;
    names.set(s.id, s.name ?? String(s.id));
    parents.set(s.id, parentId ?? s.parentSuite?.id);
    rows.set(s.id, {
      id: s.id,
      name: s.name ?? '',
      suiteType: s.suiteType,
      parentId: parentId ?? s.parentSuite?.id,
      requirementId: s.requirementId,
      queryString: s.queryString,
      hasChildren: s.hasChildren,
      path: '',
      depth: 0,
    });
    for (const c of s.children ?? []) visit(c, s.id);
  };
  for (const s of raw) visit(s, undefined);

  const pathOf = (id: number): { path: string; depth: number } => {
    const parts: string[] = [];
    let cur: number | undefined = id;
    for (let i = 0; cur !== undefined && i < 100; i++) {
      parts.unshift(names.get(cur) ?? String(cur));
      cur = parents.get(cur);
    }
    return { path: parts.join(' / '), depth: parts.length - 1 };
  };
  return [...rows.values()].map((r) => ({ ...r, ...pathOf(r.id) }));
}
