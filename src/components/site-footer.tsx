import { COUPLE } from "#/lib/registry-data.ts";

export function SiteFooter() {
	return (
		<footer className="mt-16 border-t border-border/70 py-10 text-center">
			<div className="page-wrap space-y-1">
				<p className="font-display text-base font-semibold text-foreground">
					Made with 💛 for {COUPLE.title} {COUPLE.year}
				</p>
				<p className="text-sm text-muted-foreground">
					A gift registry where love is measured in dollars, not dollars spent.
				</p>
			</div>
		</footer>
	);
}
