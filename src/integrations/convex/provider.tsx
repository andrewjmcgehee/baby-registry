import type { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";

export default function AppConvexProvider({
	client,
	children,
}: {
	client: ConvexReactClient;
	children: React.ReactNode;
}) {
	return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
