// Android's platform-specific entry registers its headless home-screen widget handler.
// This fallback is .tsx on purpose: Metro tries every platform suffix of one extension before the next, so a
// register.ts here would win over register.android.tsx and the widget handler would never be registered.
export {};
