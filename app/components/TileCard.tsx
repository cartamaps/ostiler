import maplibregl from "maplibre-gl";
import { useEffect, useState } from "react";
import { TileRecord } from "~/database";
import { Card, CardContent, CardHeader, CardTitle, Separator } from "./ui";
import type { BBox } from "geojson";
import { useQuery } from "@tanstack/react-query";
import Map, { Source } from "react-map-gl/maplibre";
import { PMTiles, Protocol, FetchSource } from "pmtiles";
import layers from "protomaps-themes-base";
import { TileJSON } from "~/types";
import { formatFileSize } from "~/lib/utils";

type TileCardProps = {
  tile: TileRecord;
};

export function TileCard({ tile }: TileCardProps) {
  const jsonEndpoint = tile.key.replace(".pmtiles", ".json");
  const { data: metadata, isLoading } = useQuery({
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: ["tiles", tile.id],
    queryFn: async () => {
      const res = await fetch(
        `https://pmtiles-server.franco-c7d.workers.dev/${jsonEndpoint}`
      );
      return (await res.json()) as TileJSON;
    },
  });

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  console.log(metadata);
  return (
    <Card className="overflow-hidden">
      <div className="h-40 bg-muted">
        <img
          src="https://cloud.maptiler.com/static/img/placeholder.png?t=1706015365"
          className="object-cover h-full w-full"
        />
      </div>
      {/* {metadata && (
          <Map
            // initialViewState={{
            //   bounds: metadata.bounds as [number, number, number, number],a
            // }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={{
              version: 8,
              glyphs:
                "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
              sources: {
                source: {
                  type: "vector",
                  url: `https://pmtiles-server.franco-c7d.workers.dev/${jsonEndpoint}`,
                  tiles: metadata.tiles,
                  minzoom: metadata.minzoom,
                  maxzoom: metadata.maxzoom,
                  bounds: metadata.bounds,
                },
              },
              layers: metadata.vector_layers.map((layer) => ({
                type: "fill",
                source: "source",
                "source-layer": layer.id,
                id: `${layer.id}_fill`,
                paint: {
                  "fill-color": "#ff0000",
                },
              })),
              // layers: layers("protomaps", "light"),
            }}
          />
        )} */}
      {/* </div> */}
      <CardHeader className="p-4">
        <CardTitle>{tile.key}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="grid grid-cols-2 p-4 gap-y-3">
        <p>
          z{metadata?.minzoom}-{metadata?.maxzoom}
        </p>
        <p>{tile.created_at}</p>
        <p>Layers</p>
        <p>{metadata?.vector_layers.length}</p>
        <p>Center</p>
        <p>
          {metadata?.center.slice(0, 2).map((b, idx) => (
            <span className="block" key={idx}>
              {b.toFixed(4)}
            </span>
          ))}
        </p>
        <p>Bounds</p>
        <p>
          {metadata?.bounds.map((b, idx) => (
            <span className="block" key={idx}>
              {b.toFixed(4)}
            </span>
          ))}
        </p>
        {/* {metadata && <pre>{JSON.stringify(metadata, null, 2)}</pre>} */}
      </CardContent>
    </Card>
  );
}
