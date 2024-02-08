import { Env, RangeResponse, Source } from "../types";
import { KeyNotFoundError } from "./errors";
import { pmtiles_path } from "./utils";

export class R2Source implements Source {
  env: Env;
  archive_name: string;

  constructor(env: Env, archive_name: string) {
    this.env = env;
    this.archive_name = archive_name;
  }

  getKey() {
    return this.archive_name;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const key = pmtiles_path(this.archive_name, this.env.PMTILES_PATH);
    const resp = await this.env.TILE_BUCKET.get(key, {
      range: { offset: offset, length: length },
    });
    if (!resp) {
      throw new KeyNotFoundError("Archive not found");
    }
    const o = resp as R2ObjectBody;
    const a = await o.arrayBuffer();
    return {
      data: a,
      etag: o.etag,
      cacheControl: o.httpMetadata?.cacheControl,
      expires: o.httpMetadata?.cacheExpiry?.toISOString(),
    };
  }
}
