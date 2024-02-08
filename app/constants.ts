export enum SESSION_KEYS {
  theme = "__osstiler-theme",
  auth = "__osstiler-auth",
}
export type SessionData = {
  [k in SESSION_KEYS]: string | null | undefined;
};
