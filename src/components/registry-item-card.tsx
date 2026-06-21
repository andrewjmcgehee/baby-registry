import { Check, Heart } from "lucide-react";

import { FundingBar } from "#/components/funding-bar.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import {
	itemTotalGoal,
	type RegistryItem,
	TILE_TINTS,
} from "#/lib/registry-data.ts";
import { cn } from "#/lib/utils.ts";

interface RegistryItemCardProps {
	item: RegistryItem;
	onContribute: (item: RegistryItem) => void;
}

export function RegistryItemCard({
	item,
	onContribute,
}: RegistryItemCardProps) {
	const total = itemTotalGoal(item);
	const count = item.count ?? 1;
	const pending = item.pending ?? 0;
	const confirmedPct = Math.min((item.raised / total) * 100, 100);
	// Pending fills whatever room is left after the confirmed segment.
	const pendingPct = Math.min((pending / total) * 100, 100 - confirmedPct);
	const pct = Math.round(confirmedPct + pendingPct);
	const funded = item.raised >= total;
	const remaining = Math.max(total - item.raised, 0);
	// Funded items stop accepting contributions unless they opt into overfunding.
	const acceptsMore = !funded || (item.allowOverfunding ?? false);
	const tint = TILE_TINTS[item.tint];

	return (
		<Card
			className={cn(
				"soft-card-hover overflow-hidden",
				acceptsMore && "cursor-pointer",
			)}
			onClick={acceptsMore ? () => onContribute(item) : undefined}
		>
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
					{count > 1 && (
						<p className="text-xs font-semibold text-sage-deep">
							${item.price.toLocaleString()} each · {count} wanted
						</p>
					)}
					<p className="text-sm text-muted-foreground">{item.blurb}</p>
				</div>

				<div className="mt-auto space-y-2 pt-2">
					<FundingBar
						confirmedPct={confirmedPct}
						pendingPct={pendingPct}
						className="h-2.5"
					/>
					<div className="flex items-baseline justify-between text-sm">
						<span className="font-bold text-foreground">
							${item.raised.toLocaleString()}
							<span className="font-normal text-muted-foreground">
								{" "}
								of ${total.toLocaleString()}
							</span>
						</span>
						<span className="font-semibold text-sage-deep">{pct}%</span>
					</div>
					{pending > 0 && (
						<p className="text-xs text-muted-foreground pb-2">
							+ ${pending.toLocaleString()} pending
						</p>
					)}

					<Button
						onClick={(e) => {
							// The whole card is clickable; don't double-fire.
							e.stopPropagation();
							onContribute(item);
						}}
						variant={funded ? "outline" : "default"}
						className="w-full rounded-full"
						disabled={!acceptsMore}
					>
						<Heart className="size-4" />
						{!funded
							? `Contribute · $${remaining.toLocaleString()} to go`
							: acceptsMore
								? "Add a little extra"
								: "Fully funded 💛"}
					</Button>
				</div>
			</div>
		</Card>
	);
}
