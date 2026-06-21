import { cn } from "#/lib/utils.ts";

interface FundingBarProps {
	/** Percent (0–100) of the goal that is confirmed money. */
	confirmedPct: number;
	/** Percent (0–100) of the goal that is pending/unconfirmed money. */
	pendingPct: number;
	className?: string;
}

/**
 * A funding progress bar with two segments: a solid sage fill for confirmed
 * money, then a striped sage fill for pending (unconfirmed) pledges. The two
 * widths should already be clamped so they sum to at most 100.
 */
export function FundingBar({
	confirmedPct,
	pendingPct,
	className,
}: FundingBarProps) {
	return (
		<div
			className={cn(
				"relative w-full overflow-hidden rounded-full bg-muted",
				className,
			)}
		>
			<div
				className="absolute inset-y-0 left-0 bg-sage transition-all"
				style={{ width: `${confirmedPct}%` }}
			/>
			{pendingPct > 0 && (
				<div
					className="absolute inset-y-0 transition-all"
					style={{
						left: `${confirmedPct}%`,
						width: `${pendingPct}%`,
						opacity: 0.55,
						backgroundImage:
							"repeating-linear-gradient(45deg, var(--sage) 0 6px, transparent 6px 12px)",
					}}
				/>
			)}
		</div>
	);
}
