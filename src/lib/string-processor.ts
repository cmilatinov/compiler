export type StringProcessor = (str: string) => void;
export const DEFAULT_PROCESSOR: StringProcessor = (str) => process.stdout.write(str);
