import { execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

import type PgBoss from "pg-boss";
import { BaseJob } from "./base";
import { type FormValues as TippecanoeFormValues } from "~/components/TippecanoeForm";
import { db, schema } from "~/database";
import { StorageAdapter } from "~/lib/storage.server";

export type ProcessGeoJson = Partial<TippecanoeFormValues> & {
  fileId: string;
};
export class ProcessGeoJsonJob extends BaseJob<ProcessGeoJson> {
  readonly type = "process_geojson";

  async work(job: PgBoss.Job<ProcessGeoJson>): Promise<void> {
    console.log(`[ProcessGeoJsonJob] Process FileId: ${job.data.fileId}!`);
    const { fileId, ...tippecanoeConfig } = job.data;
    const settings = await db.query.settings.findFirst();
    if (!settings?.storage) return;

    const file = await db.query.files.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, fileId);
      },
    });
    if (!file) return;

    const { storage } = settings;
    const adapter = new StorageAdapter(
      {
        endpoint: `https://${storage.accountId}.r2.cloudflarestorage.com`,
        region: storage.region ?? "auto",
        credentials: {
          accessKeyId: storage.accessKeyId,
          secretAccessKey: storage.secretAccessKey,
        },
      },
      storage.bucket
    );
    let tmpDir;
    const appPrefix = "ostiler";
    const fileName = path.basename(file.key);
    const fileExtension = path.extname(file.key);

    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix));
      const remoteFile = await adapter.getObject(file.key);
      if (!remoteFile.Body) {
        throw new Error("Body is empty");
      }

      const inputFile = `${tmpDir}/input-${fileName}.${fileExtension}`;
      const outputFile = `${tmpDir}/output-${fileName}.pmtiles`;
      const content = await remoteFile.Body.transformToByteArray();
      fs.writeFileSync(inputFile, content);

      const out = runTippecanoe({
        outputFile,
        inputFile,
        options: tippecanoeConfig,
      });
      console.log(out);

      // write file
      await adapter.putObject({
        path: `${fileName}.pmtiles`,
        content: fs.readFileSync(outputFile),
      });

      await db.insert(schema.tiles).values({
        name: fileName,
        owner_id: file.owner_id,
        key: `${fileName}.pmtiles`,
      });
      this.boss.complete(job.id);
    } catch (error) {
      console.log(error);
      this.boss.fail(job.id);
    }
  }
}

function runTippecanoe({
  outputFile,
  inputFile,
  options,
}: {
  outputFile: string;
  inputFile: string;
  options?: Partial<TippecanoeFormValues>;
}) {
  const cmd = `${process.env.TIPPECANOE_PATH} -zg -o ${outputFile} --drop-densest-as-needed ${inputFile}`;
  console.log("runTippecanoe->CMD", cmd);
  try {
    const out = execSync(cmd);
    return out.toString();
  } catch (error) {
    const execError = error as Error & { code?: number; stderr?: Buffer };
    if (execError.stderr && "maxzoom" in execError.stderr) {
      return runTippecanoe({
        outputFile,
        inputFile,
        options: {
          ...(options ?? {}),
          maximum_zoom: "12",
        },
      });
    }
    throw error;
  }
}
