// eslint-disable-next-line @typescript-eslint/no-unused-vars
const locales = ["en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
