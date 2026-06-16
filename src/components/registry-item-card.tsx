import { Check, Heart } from "lucide-react";

import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import { Progress } from "#/components/ui/progress.tsx";
import { type RegistryItem, TILE_TINTS } from "#/lib/registry-data.ts";

interface RegistryItemCardProps {
	item: RegistryItem;
	onContribute: (item: RegistryItem) => void;
}

export function RegistryItemCard({
	item,
	onContribute,
}: RegistryItemCardProps) {
	const pct = Math.min(Math.round((item.raised / item.goal) * 100), 100);
	const funded = item.raised >= item.goal;
	const remaining = Math.max(item.goal - item.raised, 0);
	const tint = TILE_TINTS[item.tint];

	return (
		<Card className="soft-card-hover overflow-hidden">
			{/* emoji tile */}
			<div
				className="relative flex h-40 items-center justify-center"
				style={{ backgroundColor: tint.bg }}
			>
				<span className="float-bob text-6xl drop-shadow-sm" aria-hidden>
					{item.emoji}
				</span>
				<Badge
					variant="outline"
					className="absolute left-3 top-3 bg-card/80 backdrop-blur-sm"
				>
					{item.category}
				</Badge>
				{funded && (
					<Badge className="absolute right-3 top-3 bg-sage text-primary-foreground">
						<Check className="size-3" />
						Fully funded
					</Badge>
				)}
			</div>

			{/* body */}
			<div className="flex flex-1 flex-col gap-3 p-5">
				<div className="space-y-1">
					<h3 className="font-display text-lg font-bold leading-tight">
						{item.name}
					</h3>
					<p className="text-sm text-muted-foreground">{item.blurb}</p>
				</div>

				<div className="mt-auto space-y-2 pt-2">
					<Progress value={pct} className="h-2.5 bg-muted" />
					<div className="flex items-baseline justify-between text-sm">
						<span className="font-bold text-foreground">
							${item.raised.toLocaleString()}
							<span className="font-normal text-muted-foreground">
								{" "}
								of ${item.goal.toLocaleString()}
							</span>
						</span>
						<span className="font-semibold text-sage-deep">{pct}%</span>
					</div>

					<Button
						onClick={() => onContribute(item)}
						variant={funded ? "outline" : "default"}
						className="w-full rounded-full"
					>
						<Heart className="size-4" />
						{funded
							? "Add a little extra"
							: `Contribute · $${remaining.toLocaleString()} to go`}
					</Button>
				</div>
			</div>
		</Card>
	);
}
