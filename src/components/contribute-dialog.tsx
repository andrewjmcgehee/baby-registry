import { Heart, PartyPopper } from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { itemTotalGoal, type RegistryItem } from "#/lib/registry-data.ts";
import { cn } from "#/lib/utils.ts";

const PRESET_AMOUNTS = [10, 25, 50, 100];

interface ContributeDialogProps {
	item: RegistryItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onContribute: (itemId: string, amount: number) => void;
}

export function ContributeDialog({
	item,
	open,
	onOpenChange,
	onContribute,
}: ContributeDialogProps) {
	const [amount, setAmount] = React.useState<number | "">(25);
	const [name, setName] = React.useState("");
	const [note, setNote] = React.useState("");
	const [done, setDone] = React.useState(false);

	// Reset the form whenever a new item's dialog opens.
	React.useEffect(() => {
		if (open) {
			setAmount(25);
			setName("");
			setNote("");
			setDone(false);
		}
	}, [open]);

	if (!item) return null;

	const remaining = Math.max(itemTotalGoal(item) - item.raised, 0);
	const numericAmount = typeof amount === "number" ? amount : 0;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!item || numericAmount <= 0) return;
		onContribute(item.id, numericAmount);
		setDone(true);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				{done ? (
					<div className="flex flex-col items-center gap-3 py-4 text-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-secondary text-3xl">
							<PartyPopper className="size-7 text-clay" />
						</div>
						<DialogHeader className="items-center">
							<DialogTitle className="font-display text-2xl">
								Thank you so much! 💛
							</DialogTitle>
							<DialogDescription className="text-base">
								Your {formatMoney(numericAmount)} toward{" "}
								<span className="font-semibold text-foreground">
									{item.name}
								</span>{" "}
								means the world to Andrew & Marisa.
							</DialogDescription>
						</DialogHeader>
						<DialogClose asChild>
							<Button className="mt-2 rounded-full px-6">
								Back to the registry
							</Button>
						</DialogClose>
					</div>
				) : (
					<form onSubmit={handleSubmit}>
						<DialogHeader>
							<div className="mb-1 flex items-center gap-3">
								<span className="text-3xl" aria-hidden>
									{item.emoji}
								</span>
								<div>
									<DialogTitle className="font-display text-xl">
										Contribute to {item.name}
									</DialogTitle>
								</div>
							</div>
							<DialogDescription>
								You're chipping in money toward this gift — you won't be charged
								or buying anything here.{" "}
								{remaining > 0 ? (
									<>Just {formatMoney(remaining)} left to fully fund it.</>
								) : (
									<>It's fully funded, but extra love is always welcome!</>
								)}
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label>Choose an amount</Label>
								<div className="grid grid-cols-4 gap-2">
									{PRESET_AMOUNTS.map((preset) => (
										<button
											key={preset}
											type="button"
											onClick={() => setAmount(preset)}
											className={cn(
												"rounded-full border py-2 text-sm font-semibold transition-colors",
												amount === preset
													? "border-primary bg-primary text-primary-foreground"
													: "border-border bg-card hover:bg-muted",
											)}
										>
											${preset}
										</button>
									))}
								</div>
							</div>

							<div className="relative">
								<Separator />
								<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs font-medium text-muted-foreground">
									or enter an exact amount
								</span>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="custom-amount">Exact amount</Label>
								<div className="relative">
									<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
										$
									</span>
									<Input
										id="custom-amount"
										type="number"
										min={1}
										inputMode="numeric"
										className="pl-7"
										value={amount}
										onChange={(e) =>
											setAmount(
												e.target.value === "" ? "" : Number(e.target.value),
											)
										}
									/>
								</div>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="contributor-name">Your name (optional)</Label>
								<Input
									id="contributor-name"
									placeholder="Peter Piper"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="contributor-note">
									A little note (optional)
								</Label>
								<Textarea
									id="contributor-note"
									placeholder="Can't wait to meet your little one!"
									rows={2}
									value={note}
									onChange={(e) => setNote(e.target.value)}
								/>
							</div>
						</div>

						<DialogFooter className="gap-2 sm:gap-2">
							<DialogClose asChild>
								<Button type="button" variant="ghost" className="rounded-full">
									Maybe later
								</Button>
							</DialogClose>
							<Button
								type="submit"
								className="rounded-full px-6"
								disabled={numericAmount <= 0}
							>
								<Heart className="size-4" />
								Contribute {numericAmount > 0 ? formatMoney(numericAmount) : ""}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

function formatMoney(n: number) {
	return `$${n.toLocaleString("en-US")}`;
}
