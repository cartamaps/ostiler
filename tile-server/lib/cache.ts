import {
  Source,
  Header,
  Entry,
  ResolvedValue,
  DecompressFunc,
  SharedPromiseCacheValue,
} from "../types";
import { defaultDecompress, getDirectory, getHeaderAndRoot } from "./utils";

export class ResolvedValueCache {
  cache: Map<string, ResolvedValue>;
  maxCacheEntries: number;
  counter: number;
  prefetch: boolean;
  decompress: DecompressFunc;

  constructor(
    maxCacheEntries = 100,
    prefetch = true,
    decompress: DecompressFunc = defaultDecompress
  ) {
    this.cache = new Map<string, ResolvedValue>();
    this.maxCacheEntries = maxCacheEntries;
    this.counter = 1;
    this.prefetch = prefetch;
    this.decompress = decompress;
  }

  async getHeader(source: Source): Promise<Header> {
    const cacheKey = source.getKey();
    const cacheValue = this.cache.get(cacheKey);
    if (cacheValue) {
      cacheValue.lastUsed = this.counter++;
      const data = cacheValue.data;
      return data as Header;
    }

    const res = await getHeaderAndRoot(source, this.decompress, this.prefetch);
    if (res[1]) {
      this.cache.set(res[1][0], {
        lastUsed: this.counter++,
        data: res[1][2],
      });
    }

    this.cache.set(cacheKey, {
      lastUsed: this.counter++,
      data: res[0],
    });
    this.prune();
    return res[0];
  }

  async getDirectory(
    source: Source,
    offset: number,
    length: number,
    header: Header
  ): Promise<Entry[]> {
    const cacheKey = `${source.getKey()}|${
      header.etag || ""
    }|${offset}|${length}`;
    const cacheValue = this.cache.get(cacheKey);
    if (cacheValue) {
      cacheValue.lastUsed = this.counter++;
      const data = cacheValue.data;
      return data as Entry[];
    }

    const directory = await getDirectory(
      source,
      this.decompress,
      offset,
      length,
      header
    );
    this.cache.set(cacheKey, {
      lastUsed: this.counter++,
      data: directory,
    });
    this.prune();
    return directory;
  }

  // for v2 backwards compatibility
  async getArrayBuffer(
    source: Source,
    offset: number,
    length: number,
    header: Header
  ): Promise<ArrayBuffer> {
    const cacheKey = `${source.getKey()}|${
      header.etag || ""
    }|${offset}|${length}`;
    const cacheValue = this.cache.get(cacheKey);
    if (cacheValue) {
      cacheValue.lastUsed = this.counter++;
      const data = await cacheValue.data;
      return data as ArrayBuffer;
    }

    const resp = await source.getBytes(offset, length, undefined, header.etag);

    this.cache.set(cacheKey, {
      lastUsed: this.counter++,
      data: resp.data,
    });
    this.prune();
    return resp.data;
  }

  prune() {
    if (this.cache.size > this.maxCacheEntries) {
      let minUsed = Infinity;
      let minKey = undefined;
      this.cache.forEach((cacheValue: ResolvedValue, key: string) => {
        if (cacheValue.lastUsed < minUsed) {
          minUsed = cacheValue.lastUsed;
          minKey = key;
        }
      });
      if (minKey) {
        this.cache.delete(minKey);
      }
    }
  }

  async invalidate(source: Source) {
    this.cache.delete(source.getKey());
    await this.getHeader(source);
  }
}

export class SharedPromiseCache {
  cache: Map<string, SharedPromiseCacheValue>;
  maxCacheEntries: number;
  counter: number;
  prefetch: boolean;
  decompress: DecompressFunc;

  constructor(
    maxCacheEntries = 100,
    prefetch = true,
    decompress: DecompressFunc = defaultDecompress
  ) {
    this.cache = new Map<string, SharedPromiseCacheValue>();
    this.maxCacheEntries = maxCacheEntries;
    this.counter = 1;
    this.prefetch = prefetch;
    this.decompress = decompress;
  }

  async getHeader(source: Source): Promise<Header> {
    const cacheKey = source.getKey();
    const cacheValue = this.cache.get(cacheKey);
    if (cacheValue) {
      cacheValue.lastUsed = this.counter++;
      const data = await cacheValue.data;
      return data as Header;
    }

    const p = new Promise<Header>((resolve, reject) => {
      getHeaderAndRoot(source, this.decompress, this.prefetch)
        .then((res) => {
          if (res[1]) {
            this.cache.set(res[1][0], {
              lastUsed: this.counter++,
              data: Promise.resolve(res[1][2]),
            });
          }
          resolve(res[0]);
          this.prune();
        })
        .catch((e) => {
          reject(e);
        });
    });
    this.cache.set(cacheKey, { lastUsed: this.counter++, data: p });
    return p;
  }

  async getDirectory(
    source: Source,
    offset: number,
    length: number,
    header: Header
  ): Promise<Entry[]> {
    const cacheKey = `${source.getKey()}|${
      header.etag || ""
    }|${offset}|${length}`;
    const cacheValue = this.cache.get(cacheKey);
    if (cacheValue) {
      cacheValue.lastUsed = this.counter++;
      const data = await cacheValue.data;
      return data as Entry[];
    }

    const p = new Promise<Entry[]>((resolve, reject) => {
      getDirectory(source, this.decompress, offset, length, header)
        .then((directory) => {
          resolve(directory);
          this.prune();
        })
        .catch((e) => {
          reject(e);
        });
    });
    this.cache.set(cacheKey, { lastUsed: this.counter++, data: p });
    return p;
  }

  // for v2 backwards compatibility
  async getArrayBuffer(
    source: Source,
    offset: number,
    length: number,
    header: Header
  ): Promise<ArrayBuffer> {
    const cacheKey = `${source.getKey()}|${
      header.etag || ""
    }|${offset}|${length}`;
    const cacheValue = this.cache.get(cacheKey);
    if (cacheValue) {
      cacheValue.lastUsed = this.counter++;
      const data = await cacheValue.data;
      return data as ArrayBuffer;
    }

    const p = new Promise<ArrayBuffer>((resolve, reject) => {
      source
        .getBytes(offset, length, undefined, header.etag)
        .then((resp) => {
          resolve(resp.data);
          if (this.cache.has(cacheKey)) {
            //
          }
          this.prune();
        })
        .catch((e) => {
          reject(e);
        });
    });
    this.cache.set(cacheKey, { lastUsed: this.counter++, data: p });
    return p;
  }

  prune() {
    if (this.cache.size >= this.maxCacheEntries) {
      let minUsed = Infinity;
      let minKey = undefined;
      this.cache.forEach((cacheValue: SharedPromiseCacheValue, key: string) => {
        if (cacheValue.lastUsed < minUsed) {
          minUsed = cacheValue.lastUsed;
          minKey = key;
        }
      });
      if (minKey) {
        this.cache.delete(minKey);
      }
    }
  }

  async invalidate(source: Source) {
    this.cache.delete(source.getKey());
    await this.getHeader(source);
  }
}
