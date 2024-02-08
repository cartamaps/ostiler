import type { GeoJSON } from "geojson";
import { check } from "@placemarkio/check-geojson";
import {
  Button,
  Dropzone,
  DropzoneAccepted,
  DropzoneIdle,
  DropzoneRejected,
  FileRejection,
} from "~/components/ui";
import { IconFile, IconLoader2 } from "@tabler/icons-react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatFileSize, readFileContent } from "~/lib/utils";
import { useSignedStorage } from "~/hooks/useSignedStorage";
import { trpc } from "~/lib/trpc";
import { useNavigate } from "@remix-run/react";
import {
  TippecanoeForm,
  type FormValues as TippecanoeFormValues,
} from "./TippecanoeForm";
import { useFileQueue } from "./FileQueueProvider";
import { slugify } from "~/lib/utils";

type UploadFileContextProps = {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  fileErrors: FileRejection[];
  setFileErrors: React.Dispatch<React.SetStateAction<FileRejection[]>>;
};
const UploadFileContext = createContext<UploadFileContextProps>(
  {} as unknown as UploadFileContextProps
);

export function UploadFileProvider({
  children,
}: React.ComponentPropsWithoutRef<"div">) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<FileRejection[]>([]);

  return (
    <UploadFileContext.Provider
      value={{ files, setFiles, fileErrors, setFileErrors }}
    >
      {children}
    </UploadFileContext.Provider>
  );
}

function useUploadContext() {
  return useContext(UploadFileContext);
}

export function UploadFileHandler() {
  const context = useUploadContext();

  if (context.files.length > 0) return null;

  return (
    <Dropzone
      unstyled
      config={{
        multiple: false,
        accept: {
          "application/geo+json": [".geojson"],
          "application/json": [".json"],
        },
        onDrop(acceptedFiles, fileRejections) {
          context.setFiles(acceptedFiles);
          context.setFileErrors(fileRejections);
        },
      }}
    >
      <div className="min-h-40 flex flex-col">
        <DropzoneIdle className="bg-secondary border border-dashed flex-1 flex flex-col items-center justify-center gap-y-2">
          <p className="">Drag &amp; drop a file here</p>
          <p>or</p>
          <Button type="button" size="sm">
            Select File
          </Button>
        </DropzoneIdle>
        <DropzoneAccepted className="bg-emerald-200 border border-dashed flex-1 flex flex-wrap gap-4">
          Drop it
        </DropzoneAccepted>
        <DropzoneRejected>error</DropzoneRejected>
      </div>
    </Dropzone>
  );
}

export function UploadFilePreview() {
  const context = useUploadContext();
  const navigate = useNavigate();
  const [fileContent, setFileContent] = useState<GeoJSON | null>(null);
  const [tc, setTc] = useState<Partial<TippecanoeFormValues>>();
  const getSignedUrl = trpc.storage.put.useMutation();
  const addJob = trpc.queue.create.useMutation();

  const createFile = trpc.files.create.useMutation({
    onSuccess(data) {
      navigate("/");
      addJob.mutate({
        name: "process_geojson",
        data: {
          fileId: data.id,
          ...(tc ?? {}),
        },
      });
    },
  });
  const putFile = useSignedStorage();

  const file = useMemo(() => {
    if (!context.files.length) return null;
    return context.files[0];
  }, [context.files]);

  useEffect(() => {
    if (!file) return;
    const extension = file.name.split(".").pop()!;
    if (["geojson", "json"].includes(extension)) {
      readFileContent(file, (content) => {
        if (!content) return;
        try {
          const geoData = check(content);
          setFileContent(geoData);
        } catch (error) {
          // could not parse file
        }
      });
    }
  }, [file]);

  if (!file) return null;

  const { name, size } = file;
  const [extension, ...nameParts] = file.name.split(".").reverse();
  const cleanName = nameParts.join(".");

  const upload = () => {
    const ts = new Date().getTime();
    const key = `data-files/${ts}-${slugify(cleanName)}.${extension}`;
    getSignedUrl.mutate(
      {
        key,
      },
      {
        onSuccess(signedUrl) {
          putFile.mutate(
            {
              url: signedUrl,
              file,
            },
            {
              onSuccess() {
                createFile.mutate({
                  name: cleanName,
                  key,
                  size,
                  options: tc,
                });
              },
            }
          );
        },
      }
    );
  };

  const isPending = getSignedUrl.isPending || putFile.isPending;

  return (
    <div>
      <div className="border rounded-lg flex items-start gap-4 p-6 justify-between bg-muted/50">
        <div className="relative w-24 shrink-0">
          <IconFile size={96} strokeWidth={0.5} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {extension}
          </span>
        </div>
        <div className="flex-1 max-w-[50%]">
          <div className="bg-background border rounded-lg flex flex-col gap-y-2 py-4 text-sm">
            <div className="px-4">
              <h3 className="font-semibold">File Details</h3>
            </div>
            <div className="grid grid-cols-2 px-4">
              <div className="">Name</div>
              <div className="truncate">{name}</div>
            </div>
            <div className="grid grid-cols-2 px-4">
              <div className="">Type</div>
              <div className="truncate">{extension}</div>
            </div>
            <div className="grid grid-cols-2 px-4">
              <div className="">Size</div>
              <div className="truncate">{formatFileSize(size)}</div>
            </div>
            {extension.includes("json") && fileContent && (
              <div className="grid grid-cols-2 px-4">
                <div className="">Features</div>
                <div className="truncate">
                  {"features" in fileContent ? fileContent.features.length : 1}
                </div>
              </div>
            )}
            <div className="px-4 flex items-center gap-x-2 mt-4">
              <Button size="sm" onClick={upload} disabled={isPending}>
                {isPending && <IconLoader2 size={16} className="mr-2" />}
                Upload
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => context.setFiles([])}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
      {extension.includes("json") && fileContent && (
        <div className="p-6">
          <h3 className="font-semibold">Advanced</h3>
          <p className="text-muted-foreground text-sm">
            Builds vector tilesets from large (or small) collections of GeoJSON,
            FlatGeobuf, or CSV features. Read the{" "}
            <a
              href="https://github.com/felt/tippecanoe"
              target="_blank"
              rel="noreferrer"
            >
              documenation
            </a>{" "}
            to learn more.
          </p>
          <div className="mt-4">
            <TippecanoeForm defaultValues={{ name }} onValuesChange={setTc} />
          </div>
        </div>
      )}
    </div>
  );
}
