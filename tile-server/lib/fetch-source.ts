import { RangeResponse, Source } from "../types";
import { EtagMismatch } from "./errors";

export class FetchSource implements Source {
  url: string;
  customHeaders: Headers;
  mustReload: boolean;

  constructor(url: string, customHeaders: Headers = new Headers()) {
    this.url = url;
    this.customHeaders = customHeaders;
    this.mustReload = false;
  }

  getKey() {
    return this.url;
  }

  setHeaders(customHeaders: Headers) {
    this.customHeaders = customHeaders;
  }

  async getBytes(
    offset: number,
    length: number,
    passedSignal?: AbortSignal,
    etag?: string
  ): Promise<RangeResponse> {
    let controller: AbortController | undefined;
    let signal: AbortSignal | undefined;
    if (passedSignal) {
      signal = passedSignal;
    } else {
      controller = new AbortController();
      signal = controller.signal;
    }

    const requestHeaders = new Headers(this.customHeaders);
    requestHeaders.set("range", `bytes=${offset}-${offset + length - 1}`);

    // we don't send if match because:
    // * it disables browser caching completely (Chromium)
    // * it requires a preflight request for every tile request
    // * it requires CORS configuration becasue If-Match is not a CORs-safelisted header
    // CORs configuration should expose ETag.
    // if any etag mismatch is detected, we need to ignore the browser cache
    let cache: string | undefined;
    if (this.mustReload) {
      cache = "reload";
    }

    let resp = await fetch(this.url, {
      signal: signal,
      // @ts-expect-error -- "cache" is incompatible between cloudflare workers and browser
      cache: cache,
      headers: requestHeaders,
    });

    // handle edge case where the archive is < 16384 kb total.
    if (offset === 0 && resp.status === 416) {
      const contentRange = resp.headers.get("Content-Range");
      if (!contentRange || !contentRange.startsWith("bytes */")) {
        throw Error("Missing content-length on 416 response");
      }
      const actualLength = +contentRange.substr(8);
      resp = await fetch(this.url, {
        signal: signal,
        cache: "reload",
        headers: { range: `bytes=0-${actualLength - 1}` },
      });
    }

    // if it's a weak etag, it's not useful for us, so ignore it.
    let newEtag = resp.headers.get("Etag");
    if (newEtag?.startsWith("W/")) {
      newEtag = null;
    }

    // some storage systems are misbehaved (Cloudflare R2)
    if (resp.status === 416 || (etag && newEtag && newEtag !== etag)) {
      this.mustReload = true;
      throw new EtagMismatch(etag);
    }

    if (resp.status >= 300) {
      throw Error(`Bad response code: ${resp.status}`);
    }

    // some well-behaved backends, e.g. DigitalOcean CDN, respond with 200 instead of 206
    // but we also need to detect no support for Byte Serving which is returning the whole file
    const contentLength = resp.headers.get("Content-Length");
    if (resp.status === 200 && (!contentLength || +contentLength > length)) {
      if (controller) controller.abort();
      throw Error(
        "Server returned no content-length header or content-length exceeding request. Check that your storage backend supports HTTP Byte Serving."
      );
    }

    const a = await resp.arrayBuffer();
    return {
      data: a,
      etag: newEtag || undefined,
      cacheControl: resp.headers.get("Cache-Control") || undefined,
      expires: resp.headers.get("Expires") || undefined,
    };
  }
}
