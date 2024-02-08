import { Separator } from "~/components/ui";
import {
  UploadFileHandler,
  UploadFilePreview,
  UploadFileProvider,
} from "~/components/UploadFileProvider";

export default function Route() {
  return (
    <div className="p-8 lg:p-16">
      <div className="flex items-end justify-between">
        <h1 className="text-8xl font-bold tracking-tighter leading-none">
          upload file
        </h1>

        <div className="p-4 lg:p-6 bg-emerald-200 border border-emerald-300 rounded-lg">
          <p>
            Supported file:{" "}
            <a
              href="https://geojson.org/"
              className="underline font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              GeoJSON
            </a>
            ,{" "}
            <a
              href="https://github.com/mapbox/mbtiles-spec"
              className="underline font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              MBTiles
            </a>{" "}
            or{" "}
            <a
              href="https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md"
              className="underline font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              PMTiles
            </a>
            {"."}
          </p>
        </div>
      </div>
      <Separator className="my-8" />
      <div className="">
        <UploadFileProvider>
          <UploadFileHandler />
          <UploadFilePreview />
        </UploadFileProvider>
      </div>
    </div>
  );
}
