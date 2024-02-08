import { decompressSync } from "fflate";
import {
  BufferPosition,
  Compression,
  DecompressFunc,
  Entry,
  Header,
  Source,
  TileType,
} from "../types";
import { HEADER_SIZE_BYTES, TILE, TILESET, tzValues } from "./constants";
import v2 from "./v2";

export const pmtiles_path = (name: string, setting?: string): string => {
  if (setting) {
    return setting.replaceAll("{name}", name);
  }
  return name + ".pmtiles";
};

export const tile_path = (
  path: string
): {
  ok: boolean;
  name: string;
  tile?: [number, number, number];
  ext: string;
} => {
  const tile_match = path.match(TILE);

  if (tile_match) {
    const g = tile_match.groups! as unknown as {
      NAME: string;
      Z: number;
      X: number;
      Y: number;
      EXT: string;
    };
    return { ok: true, name: g.NAME, tile: [+g.Z, +g.X, +g.Y], ext: g.EXT };
  }

  const tileset_match = path.match(TILESET);

  if (tileset_match) {
    const g = tileset_match.groups! as unknown as {
      NAME: string;
    };
    return { ok: true, name: g.NAME, ext: "json" };
  }

  return { ok: false, name: "", tile: [0, 0, 0], ext: "" };
};

export const tileJSON = (
  header: Header,
  metadata: unknown,
  hostname: string,
  tileset_name: string
) => {
  let ext = "";
  if (header.tileType === TileType.Mvt) {
    ext = ".mvt";
  } else if (header.tileType === TileType.Png) {
    ext = ".png";
  } else if (header.tileType === TileType.Jpeg) {
    ext = ".jpg";
  } else if (header.tileType === TileType.Webp) {
    ext = ".webp";
  } else if (header.tileType === TileType.Avif) {
    ext = ".avif";
  }

  const typedMetadata = metadata as Record<string, unknown>;
  return {
    tilejson: "3.0.0",
    scheme: "xyz",
    tiles: ["https://" + hostname + "/" + tileset_name + "/{z}/{x}/{y}" + ext],
    vector_layers: typedMetadata.vector_layers,
    attribution: typedMetadata.attribution,
    description: typedMetadata.description,
    name: typedMetadata.name,
    version: typedMetadata.version,
    bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
    center: [header.centerLon, header.centerLat, header.centerZoom],
    minzoom: header.minZoom,
    maxzoom: header.maxZoom,
  };
};

export async function nativeDecompress(
  buf: ArrayBuffer,
  compression: Compression
): Promise<ArrayBuffer> {
  if (compression === Compression.None || compression === Compression.Unknown) {
    return buf;
  } else if (compression === Compression.Gzip) {
    const stream = new Response(buf).body!;
    const result = stream.pipeThrough(new DecompressionStream("gzip"));
    return new Response(result).arrayBuffer();
  } else {
    throw Error("Compression method not supported");
  }
}

export async function defaultDecompress(
  buf: ArrayBuffer,
  compression: Compression
): Promise<ArrayBuffer> {
  if (compression === Compression.None || compression === Compression.Unknown) {
    return buf;
  }
  if (compression === Compression.Gzip) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed to detect DecompressionStream in browser+node+cloudflare workers
    if (typeof (globalThis as any).DecompressionStream === "undefined") {
      return decompressSync(new Uint8Array(buf));
    }
    const stream = new Response(buf).body;
    if (!stream) {
      throw Error("Failed to read response stream");
    }
    const result: ReadableStream<Uint8Array> = stream.pipeThrough(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed to detect DecompressionStream in browser+node+cloudflare workers
      new (globalThis as any).DecompressionStream("gzip")
    );
    return new Response(result).arrayBuffer();
  }
  throw Error("Compression method not supported");
}

export async function getHeaderAndRoot(
  source: Source,
  decompress: DecompressFunc,
  prefetch: boolean
): Promise<[Header, [string, number, Entry[] | ArrayBuffer]?]> {
  const resp = await source.getBytes(0, 16384);

  const v = new DataView(resp.data);
  if (v.getUint16(0, true) !== 0x4d50) {
    throw new Error("Wrong magic number for PMTiles archive");
  }

  // V2 COMPATIBILITY
  if (detectVersion(resp.data) < 3) {
    return [await v2.getHeader(source)];
  }

  const headerData = resp.data.slice(0, HEADER_SIZE_BYTES);

  const header = bytesToHeader(headerData, resp.etag);

  // optimistically set the root directory
  // TODO check root bounds
  if (prefetch) {
    const rootDirData = resp.data.slice(
      header.rootDirectoryOffset,
      header.rootDirectoryOffset + header.rootDirectoryLength
    );
    const dirKey = `${source.getKey()}|${header.etag || ""}|${
      header.rootDirectoryOffset
    }|${header.rootDirectoryLength}`;

    const rootDir = deserializeIndex(
      await decompress(rootDirData, header.internalCompression)
    );
    return [header, [dirKey, rootDir.length, rootDir]];
  }

  return [header, undefined];
}

export function detectVersion(a: ArrayBuffer): number {
  const v = new DataView(a);
  if (v.getUint16(2, true) === 2) {
    console.warn(
      "PMTiles spec version 2 has been deprecated; please see github.com/protomaps/PMTiles for tools to upgrade"
    );
    return 2;
  }
  if (v.getUint16(2, true) === 1) {
    console.warn(
      "PMTiles spec version 1 has been deprecated; please see github.com/protomaps/PMTiles for tools to upgrade"
    );
    return 1;
  }
  return 3;
}

export function getUint64(v: DataView, offset: number): number {
  const wh = v.getUint32(offset + 4, true);
  const wl = v.getUint32(offset + 0, true);
  return wh * 2 ** 32 + wl;
}

export function bytesToHeader(bytes: ArrayBuffer, etag?: string): Header {
  const v = new DataView(bytes);
  const specVersion = v.getUint8(7);
  if (specVersion > 3) {
    throw Error(
      `Archive is spec version ${specVersion} but this library supports up to spec version 3`
    );
  }

  return {
    specVersion: specVersion,
    rootDirectoryOffset: getUint64(v, 8),
    rootDirectoryLength: getUint64(v, 16),
    jsonMetadataOffset: getUint64(v, 24),
    jsonMetadataLength: getUint64(v, 32),
    leafDirectoryOffset: getUint64(v, 40),
    leafDirectoryLength: getUint64(v, 48),
    tileDataOffset: getUint64(v, 56),
    tileDataLength: getUint64(v, 64),
    numAddressedTiles: getUint64(v, 72),
    numTileEntries: getUint64(v, 80),
    numTileContents: getUint64(v, 88),
    clustered: v.getUint8(96) === 1,
    internalCompression: v.getUint8(97),
    tileCompression: v.getUint8(98),
    tileType: v.getUint8(99),
    minZoom: v.getUint8(100),
    maxZoom: v.getUint8(101),
    minLon: v.getInt32(102, true) / 10000000,
    minLat: v.getInt32(106, true) / 10000000,
    maxLon: v.getInt32(110, true) / 10000000,
    maxLat: v.getInt32(114, true) / 10000000,
    centerZoom: v.getUint8(118),
    centerLon: v.getInt32(119, true) / 10000000,
    centerLat: v.getInt32(123, true) / 10000000,
    etag: etag,
  };
}

export function deserializeIndex(buffer: ArrayBuffer): Entry[] {
  const p = { buf: new Uint8Array(buffer), pos: 0 };
  const numEntries = readVarint(p);

  const entries: Entry[] = [];

  let lastId = 0;
  for (let i = 0; i < numEntries; i++) {
    const v = readVarint(p);
    entries.push({ tileId: lastId + v, offset: 0, length: 0, runLength: 1 });
    lastId += v;
  }

  for (let i = 0; i < numEntries; i++) {
    entries[i].runLength = readVarint(p);
  }

  for (let i = 0; i < numEntries; i++) {
    entries[i].length = readVarint(p);
  }

  for (let i = 0; i < numEntries; i++) {
    const v = readVarint(p);
    if (v === 0 && i > 0) {
      entries[i].offset = entries[i - 1].offset + entries[i - 1].length;
    } else {
      entries[i].offset = v - 1;
    }
  }

  return entries;
}

export function toNum(low: number, high: number): number {
  return (high >>> 0) * 0x100000000 + (low >>> 0);
}

export function readVarintRemainder(l: number, p: BufferPosition): number {
  const buf = p.buf;
  let b = buf[p.pos++]!;
  let h = (b & 0x70) >> 4;
  if (b < 0x80) return toNum(l, h);
  b = buf[p.pos++]!;
  h |= (b & 0x7f) << 3;
  if (b < 0x80) return toNum(l, h);
  b = buf[p.pos++]!;
  h |= (b & 0x7f) << 10;
  if (b < 0x80) return toNum(l, h);
  b = buf[p.pos++]!;
  h |= (b & 0x7f) << 17;
  if (b < 0x80) return toNum(l, h);
  b = buf[p.pos++]!;
  h |= (b & 0x7f) << 24;
  if (b < 0x80) return toNum(l, h);
  b = buf[p.pos++]!;
  h |= (b & 0x01) << 31;
  if (b < 0x80) return toNum(l, h);
  throw new Error("Expected varint not more than 10 bytes");
}

/** @hidden */
export function readVarint(p: BufferPosition): number {
  const buf = p.buf;
  let b = buf[p.pos++]!;
  let val = b & 0x7f;
  if (b < 0x80) return val;
  b = buf[p.pos++]!;
  val |= (b & 0x7f) << 7;
  if (b < 0x80) return val;
  b = buf[p.pos++]!;
  val |= (b & 0x7f) << 14;
  if (b < 0x80) return val;
  b = buf[p.pos++]!;
  val |= (b & 0x7f) << 21;
  if (b < 0x80) return val;
  b = buf[p.pos]!;
  val |= (b & 0x0f) << 28;

  return readVarintRemainder(val, p);
}

export async function getDirectory(
  source: Source,
  decompress: DecompressFunc,
  offset: number,
  length: number,
  header: Header
): Promise<Entry[]> {
  const resp = await source.getBytes(offset, length, undefined, header.etag);
  const data = await decompress(resp.data, header.internalCompression);
  const directory = deserializeIndex(data);
  if (directory.length === 0) {
    throw new Error("Empty directory is invalid");
  }

  return directory;
}

export function zxyToTileId(z: number, x: number, y: number): number {
  if (z > 26) {
    throw Error("Tile zoom level exceeds max safe number limit (26)");
  }
  if (x > 2 ** z - 1 || y > 2 ** z - 1) {
    throw Error("tile x/y outside zoom level bounds");
  }

  const acc = tzValues[z]!;
  const n = 2 ** z;
  let rx = 0;
  let ry = 0;
  let d = 0;
  const xy = [x, y] as [number, number];
  let s = n / 2;
  while (s > 0) {
    rx = (xy[0] & s) > 0 ? 1 : 0;
    ry = (xy[1] & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    rotate(s, xy, rx, ry);
    s = s / 2;
  }
  return acc + d;
}

function rotate(n: number, xy: [number, number], rx: number, ry: number): void {
  if (ry === 0) {
    if (rx === 1) {
      xy[0] = n - 1 - xy[0];
      xy[1] = n - 1 - xy[1];
    }
    const t = xy[0];
    xy[0] = xy[1];
    xy[1] = t;
  }
}

export function findTile(entries: Entry[], tileId: number): Entry | null {
  let m = 0;
  let n = entries.length - 1;
  while (m <= n) {
    const k = (n + m) >> 1;
    const cmp = tileId - entries[k]!.tileId;
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return entries[k]!;
    }
  }

  // at this point, m > n
  if (n >= 0) {
    if (entries[n]!.runLength === 0) {
      return entries[n]!;
    }
    if (tileId - entries[n]!.tileId < entries[n]!.runLength) {
      return entries[n]!;
    }
  }
  return null;
}
