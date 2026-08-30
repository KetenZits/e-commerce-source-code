import type { Locale } from "../config";
import { en, type Messages } from "./en";
import { th } from "./th";

export const dictionaries: Record<Locale, Messages> = { en, th };
export type { Messages };
