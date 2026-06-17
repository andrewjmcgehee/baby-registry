import { LucideBaby } from "lucide-react";

import { COUPLE } from "#/lib/registry-data.ts";

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
			<div className="page-wrap flex h-16 items-center justify-between">
				<a href="/" className="flex items-center gap-2.5 no-underline">
					<span className="flex size-9 items-center justify-center rounded-full bg-sage text-primary-foreground">
						<LucideBaby className="size-5" />
					</span>
					<span className="font-display text-lg font-bold text-foreground">
						{COUPLE.parentOne} &amp; {COUPLE.parentTwo}&apos;s Baby Registry
					</span>
				</a>
			</div>
		</header>
	);
}
