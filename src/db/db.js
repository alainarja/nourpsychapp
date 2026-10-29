// Offline data layer on top of AsyncStorage.
// Each collection is stored as a JSON array under its own key and cached in memory.
// The API (all/get/insert/update/remove/where) is intentionally small so it can be
// swapped for a real backend client later without touching screens.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const PREFIX = '@st/';
const cache = {};
const listeners = new Map(); // collection -> Set<fn>

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function load(name) {
  if (cache[name]) return cache[name];
  const raw = await AsyncStorage.getItem(PREFIX + name);
  cache[name] = raw ? JSON.parse(raw) : [];
  return cache[name];
}

async function save(name, rows) {
  cache[name] = rows;
  await AsyncStorage.setItem(PREFIX + name, JSON.stringify(rows));
  listeners.get(name)?.forEach((fn) => fn(rows));
}

export const db = {
  all: (name) => load(name),

  async get(name, id) {
    return (await load(name)).find((r) => r.id === id) ?? null;
  },

  async where(name, predicate) {
    return (await load(name)).filter(predicate);
  },

  async insert(name, row) {
    const record = { id: uid(), createdAt: new Date().toISOString(), ...row };
    await save(name, [...(await load(name)), record]);
    return record;
  },

  async insertMany(name, rows) {
    await save(name, [...(await load(name)), ...rows]);
  },

  async update(name, id, patch) {
    let updated = null;
    const rows = (await load(name)).map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    });
    await save(name, rows);
    return updated;
  },

  async remove(name, id) {
    await save(name, (await load(name)).filter((r) => r.id !== id));
  },

  async getMeta(key) {
    const raw = await AsyncStorage.getItem(PREFIX + 'meta:' + key);
    return raw ? JSON.parse(raw) : null;
  },

  async setMeta(key, value) {
    if (value === null) await AsyncStorage.removeItem(PREFIX + 'meta:' + key);
    else await AsyncStorage.setItem(PREFIX + 'meta:' + key, JSON.stringify(value));
  },

  async reset() {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    await AsyncStorage.multiRemove(keys);
    Object.keys(cache).forEach((k) => delete cache[k]);
    listeners.forEach((set, name) => set.forEach((fn) => fn([])));
  },
};

export function subscribe(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => listeners.get(name).delete(fn);
}

// Live view of a collection; re-renders whenever it changes anywhere in the app.
export function useCollection(name) {
  const [rows, setRows] = useState(cache[name] ?? []);
  const [loading, setLoading] = useState(!cache[name]);

  useEffect(() => {
    let active = true;
    load(name).then((data) => {
      if (active) {
        // Prefer the cache: a write (e.g. seeding) may have landed while this read was in flight.
        setRows(cache[name] ?? data);
        setLoading(false);
      }
    });
    const unsub = subscribe(name, (data) => active && setRows(data));
    return () => {
      active = false;
      unsub();
    };
  }, [name]);

  return { data: rows, loading };
}
