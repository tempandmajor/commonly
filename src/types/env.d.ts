// Ambient typing for environment access via import.meta.env used in client code
// This makes `import.meta.env[VAR_NAME]` compile under strict TypeScript.
declare interface ImportMeta {
  env: Record<string, string | undefined>;
}
