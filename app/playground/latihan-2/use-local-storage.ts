"use client";

import { useSyncExternalStore } from "react";

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

const listeners = new Set<() => void>();

function subscribe(onChange: () => void){
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return(() => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  })
}


function notifyListeners(){
  listeners.forEach((listener) => listener());
}

function parseStored<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T,): [T, SetValue<T>] {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null
  );

  const value = parseStored(raw, initialValue);

  const setValue: SetValue<T> = (next) => {
    const current = parseStored(window.localStorage.getItem(key), initialValue);
    const resolved = next instanceof Function ? next(current) : next;
    window.localStorage.setItem(key, JSON.stringify(resolved));
    notifyListeners();
  };

  return [value, setValue];
}
