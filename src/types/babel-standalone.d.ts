declare module "@babel/standalone" {
  export interface TransformOptions {
    presets?: string[] | [string, Record<string, unknown>][];
    plugins?: string[];
    filename?: string;
    [key: string]: unknown;
  }
  export interface BabelFileResult {
    code: string;
    map?: unknown;
    ast?: unknown;
  }
  export function transform(
    code: string,
    options?: TransformOptions,
  ): BabelFileResult;
  const Babel: {
    transform: typeof transform;
    availablePresets: Record<string, unknown>;
    availablePlugins: Record<string, unknown>;
  };
  export default typeof Babel;
}
