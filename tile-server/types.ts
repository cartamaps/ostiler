export interface Env {
  ALLOWED_ORIGINS?: string;
  TILE_BUCKET: R2Bucket;
  CACHE_MAX_AGE?: number;
  PMTILES_PATH?: string;
  PUBLIC_HOSTNAME?: string;
}

export interface Entry {
  tileId: number;
  offset: number;
  length: number;
  runLength: number;
}

export interface EntryV2 {
  z: number;
  x: number;
  y: number;
  offset: number;
  length: number;
  isDir: boolean;
}

export enum Compression {
  Unknown = 0,
  None = 1,
  Gzip = 2,
  Brotli = 3,
  Zstd = 4,
}

export enum TileType {
  Unknown = 0,
  Mvt = 1,
  Png = 2,
  Jpeg = 3,
  Webp = 4,
  Avif = 5,
}

export interface Header {
  specVersion: number;
  rootDirectoryOffset: number;
  rootDirectoryLength: number;
  jsonMetadataOffset: number;
  jsonMetadataLength: number;
  leafDirectoryOffset: number;
  leafDirectoryLength?: number;
  tileDataOffset: number;
  tileDataLength?: number;
  numAddressedTiles: number;
  numTileEntries: number;
  numTileContents: number;
  clustered: boolean;
  internalCompression: Compression;
  tileCompression: Compression;
  tileType: TileType;
  minZoom: number;
  maxZoom: number;
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  centerZoom: number;
  centerLon: number;
  centerLat: number;
  etag?: string;
}

export interface RangeResponse {
  data: ArrayBuffer;
  etag?: string;
  expires?: string;
  cacheControl?: string;
}

export interface Source {
  getBytes: (
    offset: number,
    length: number,
    signal?: AbortSignal,
    etag?: string
  ) => Promise<RangeResponse>;

  getKey: () => string;
}

export interface Cache {
  getHeader: (source: Source) => Promise<Header>;
  getDirectory: (
    source: Source,
    offset: number,
    length: number,
    header: Header
  ) => Promise<Entry[]>;
  getArrayBuffer: (
    source: Source,
    offset: number,
    length: number,
    header: Header
  ) => Promise<ArrayBuffer>;
  invalidate: (source: Source) => Promise<void>;
}

export type DecompressFunc = (
  buf: ArrayBuffer,
  compression: Compression
) => Promise<ArrayBuffer>;

export interface SharedPromiseCacheValue {
  lastUsed: number;
  data: Promise<Header | Entry[] | ArrayBuffer>;
}

/** @hidden */
export interface BufferPosition {
  buf: Uint8Array;
  pos: number;
}

export interface ResolvedValue {
  lastUsed: number;
  data: Header | Entry[] | ArrayBuffer;
}

export interface Zxy {
  z: number;
  x: number;
  y: number;
}
