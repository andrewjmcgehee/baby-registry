import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";

import { api } from "../../convex/_generated/api";

/** Public wall of well-wishes left with contributions. Amounts are never shown. */
export function FriendlyNotes() {
	const { data: notes } = useQuery(convexQuery(api.registry.listNotes, {}));
	if (!notes || notes.length === 0) return null;

	return (
		<section className="page-wrap py-10">
			<div className="mb-6 flex flex-col items-center text-center">
				<span className="kicker">
					<Quote className="size-3.5" />
					Well-wishes
				</span>
				<h2 className="mt-3 font-display text-2xl font-bold">
					Notes from friends &amp; family
				</h2>
			</div>

			<div className="gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
				{notes.map((n) => (
					<div key={n.id} className="soft-card break-inside-avoid p-5">
						<p className="text-sm leading-relaxed">“{n.note}”</p>
						<p className="mt-3 text-sm font-semibold text-sage-deep">
							— {n.name ?? "Anonymous"}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
