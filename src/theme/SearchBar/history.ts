/**
 * Historique des recherches récentes, conservé uniquement dans le navigateur (localStorage).
 * Le stockage est injecté pour pouvoir tester sans navigateur.
 */

export const MAX_RECENT = 5;
const STORAGE_KEY = 'o2switch-docs:recent-searches';

export type RecentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Renvoie le localStorage, ou null s'il est inaccessible (navigation privée, données bloquées, rendu serveur). */
export function browserStorage(): RecentStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // L'accès au localStorage peut lever une exception : l'historique est alors simplement désactivé.
    return null;
  }
}

/** Ajoute une requête en tête, sans doublon (casse ignorée), dans la limite de MAX_RECENT. */
export function addRecent(list: string[], query: string): string[] {
  const value = query.trim();
  if (!value) return list;
  const rest = list.filter((item) => item.toLowerCase() !== value.toLowerCase());
  return [value, ...rest].slice(0, MAX_RECENT);
}

export function loadRecent(storage: RecentStorage | null = browserStorage()): string[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT);
  } catch {
    // Contenu illisible ou stockage refusé : on repart d'un historique vide.
    return [];
  }
}

/** Enregistre la requête et renvoie la nouvelle liste. */
export function rememberRecent(query: string, storage: RecentStorage | null = browserStorage()): string[] {
  const next = addRecent(loadRecent(storage), query);
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota dépassé ou écriture refusée : la recherche fonctionne, seul l'historique n'est pas conservé.
  }
  return next;
}

export function clearRecent(storage: RecentStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Même cas que ci-dessus : rien à effacer si le stockage est inaccessible.
  }
}
