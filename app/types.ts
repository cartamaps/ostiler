export type UserSession = {
  sub: string;
};

export interface TileJSON {
  tilejson: string;
  scheme: string;
  tiles: string[];
  vector_layers: VectorLayer[];
  description: string;
  name: string;
  version: string;
  bounds: [number, number, number, number];
  center: number[];
  minzoom: number;
  maxzoom: number;
}

export interface VectorLayer {
  id: string;
  description: string;
  minzoom: number;
  maxzoom: number;
  fields: Record<string, unknown>;
}
