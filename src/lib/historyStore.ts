type HistoryItem = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  duration?: number | string;
  viewCount?: number | string;
  publishedAt?: string;
  channel?: { id?: string; name?: string };
  createdAt: string;
};

// Simple in-memory history store for dev/demo purposes.
// Keyed by a 'user' key; in production you'd use a proper DB keyed by user id.
const store: Map<string, HistoryItem[]> = new Map();

const DEFAULT_KEY = 'default';

export function getHistory(key: string = DEFAULT_KEY): HistoryItem[] {
  return store.get(key) || [];
}

export function addHistory(item: Omit<HistoryItem, 'createdAt'>, key: string = DEFAULT_KEY) {
  const list = getHistory(key).filter((i) => i.id !== item.id);
  const newItem: HistoryItem = { ...item, createdAt: new Date().toISOString() };
  // add to front
  list.unshift(newItem);
  // cap to recent 200
  store.set(key, list.slice(0, 200));
  return newItem;
}

export function removeHistory(id: string, key: string = DEFAULT_KEY) {
  const list = getHistory(key).filter((i) => i.id !== id);
  store.set(key, list);
  return true;
}

export function clearHistory(key: string = DEFAULT_KEY) {
  store.set(key, []);
  return true;
}

export default {
  getHistory,
  addHistory,
  removeHistory,
  clearHistory,
};
