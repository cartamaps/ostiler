import { DecompressFunc, RangeResponse, Source } from "../types";
import { ResolvedValueCache } from "./cache";
import { EtagMismatch } from "./errors";
import { FetchSource } from "./fetch-source";
import { defaultDecompress, findTile, zxyToTileId } from "./utils";
import v2 from "./v2";

export class PMTiles {
  source: Source;
  cache: ResolvedValueCache;
  decompress: DecompressFunc;

  constructor(
    source: Source | string,
    cache: ResolvedValueCache,
    decompress?: DecompressFunc
  ) {
    if (typeof source === "string") {
      this.source = new FetchSource(source);
    } else {
      this.source = source;
    }
    if (decompress) {
      this.decompress = decompress;
    } else {
      this.decompress = defaultDecompress;
    }
    this.cache = cache;
  }

  async getHeader() {
    return await this.cache.getHeader(this.source);
  }

  async getZxyAttempt(
    z: number,
    x: number,
    y: number,
    signal?: AbortSignal
  ): Promise<RangeResponse | undefined> {
    const tileId = zxyToTileId(z, x, y);
    const header = await this.cache.getHeader(this.source);

    // V2 COMPATIBILITY
    if (header.specVersion < 3) {
      return v2.getZxy(header, this.source, this.cache, z, x, y, signal);
    }

    if (z < header.minZoom || z > header.maxZoom) {
      return undefined;
    }

    let dO = header.rootDirectoryOffset;
    let dL = header.rootDirectoryLength;
    for (let depth = 0; depth <= 3; depth++) {
      const directory = await this.cache.getDirectory(
        this.source,
        dO,
        dL,
        header
      );
      const entry = findTile(directory, tileId);
      if (entry) {
        if (entry.runLength > 0) {
          const resp = await this.source.getBytes(
            header.tileDataOffset + entry.offset,
            entry.length,
            signal,
            header.etag
          );
          return {
            data: await this.decompress(resp.data, header.tileCompression),
            cacheControl: resp.cacheControl,
            expires: resp.expires,
          };
        }
        dO = header.leafDirectoryOffset + entry.offset;
        dL = entry.length;
      } else {
        // TODO: We should in fact return a valid RangeResponse
        // with empty data, but filled in cache control / expires headers
        return undefined;
      }
    }
    throw Error("Maximum directory depth exceeded");
  }

  async getZxy(
    z: number,
    x: number,
    y: number,
    signal?: AbortSignal
  ): Promise<RangeResponse | undefined> {
    try {
      return await this.getZxyAttempt(z, x, y, signal);
    } catch (e) {
      if (e instanceof EtagMismatch) {
        this.cache.invalidate(this.source);
        return await this.getZxyAttempt(z, x, y, signal);
      }
      throw e;
    }
  }

  async getMetadataAttempt(): Promise<unknown> {
    const header = await this.cache.getHeader(this.source);

    const resp = await this.source.getBytes(
      header.jsonMetadataOffset,
      header.jsonMetadataLength,
      undefined,
      header.etag
    );
    const decompressed = await this.decompress(
      resp.data,
      header.internalCompression
    );
    const dec = new TextDecoder("utf-8");
    return JSON.parse(dec.decode(decompressed));
  }

  async getMetadata(): Promise<unknown> {
    try {
      return await this.getMetadataAttempt();
    } catch (e) {
      if (e instanceof EtagMismatch) {
        this.cache.invalidate(this.source);
        return await this.getMetadataAttempt();
      }
      throw e;
    }
  }
}
