import ClientApp from "../ClientApp";

// Force dynamic rendering to prevent static generation of React SPA routes
export const dynamic = 'force-dynamic';

export default function CatchAllPage() {
  return <ClientApp />;
}
