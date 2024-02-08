import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button, Card, CardContent, Separator } from "~/components/ui";
import { IconCirclePlus } from "@tabler/icons-react";
import { requireAuthUser } from "~/lib/session.server";
import { db } from "~/database";
import { TileCard } from "~/components/TileCard";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await requireAuthUser(request, context.session);
  const tiles = await db.query.tiles.findMany();
  return json({
    user,
    tiles,
  });
}

export default function Index() {
  const { tiles } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 lg:p-16">
      <div className="flex items-end justify-between">
        <h1 className="text-8xl font-bold tracking-tighter leading-none">
          tiles
        </h1>
        <Button variant="outline" asChild>
          <Link to="/upload">
            <IconCirclePlus size={20} className="mr-2" />
            New Tileset
          </Link>
        </Button>
      </div>
      <Separator className="my-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
        {tiles.map((tile) => (
          <TileCard key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}
