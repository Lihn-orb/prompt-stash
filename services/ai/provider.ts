import "server-only";

export interface MetadataProvider {
  extractMetadata(content: string): Promise<unknown>;
}
