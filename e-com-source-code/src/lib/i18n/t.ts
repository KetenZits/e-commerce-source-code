import type { Messages } from "./dictionaries/en";

type Leaves<T, Prefix extends string = ""> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? Leaves<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
        : Prefix extends ""
          ? K
          : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

export type MessageKey = Leaves<Messages>;

export function getMessage(messages: Messages, key: MessageKey): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}

export function createT(messages: Messages) {
  return (key: MessageKey, vars?: Record<string, string | number>) => {
    let value = getMessage(messages, key);
    if (vars) {
      for (const [name, next] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(next));
      }
    }
    return value;
  };
}
