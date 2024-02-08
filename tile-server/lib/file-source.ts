// uses the Browser's File API, which is different from the NodeJS file API.

import { Source, RangeResponse } from "../types";

// see https://developer.mozilla.org/en-US/docs/Web/API/File_API
export class FileSource implements Source {
  file: File;

  constructor(file: File) {
    this.file = file;
  }

  getKey() {
    return this.file.name;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const blob = this.file.slice(offset, offset + length);
    const a = await blob.arrayBuffer();
    return { data: a };
  }
}
