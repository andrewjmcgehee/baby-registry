import { PartyPopper } from "lucide-react";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip.tsx";
import {
	itemTotalGoal,
	PAYMENT_ICONS,
	PAYMENT_LABELS,
	type PaymentMethod,
	paymentLinks,
	type RegistryItem,
} from "#/lib/registry-data.ts";
import { cn } from "#/lib/utils.ts";

const PRESET_AMOUNTS = [10, 25, 50, 100];

const METHOD_ORDER: PaymentMethod[] = ["venmo", "paypal"];
const METHOD_STYLES: Record<PaymentMethod, string> = {
	venmo: "bg-[#008CFF] hover:bg-[#0078dd] text-white",
	paypal: "bg-[#003087] hover:bg-[#00246b] text-white",
};

export interface ContributionPayload {
	itemId: string;
	itemName: string;
	amount: number;
	name: string;
	note?: string;
	method: PaymentMethod;
}

interface ContributeDialogProps {
	item: RegistryItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onContribute: (payload: ContributionPayload) => void | Promise<void>;
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
	const [step, setStep] = React.useState<"form" | "done">("form");
	const [chosenMethod, setChosenMethod] = React.useState<PaymentMethod | null>(
		null,
	);

	// Reset whenever a new item's dialog opens.
	React.useEffect(() => {
		if (open && item) {
			// Default to $25, but never more than what's left to fully fund it
			// (items that allow overfunding have no cap).
			const fundCap =
				(item.allowOverfunding ?? false)
					? Infinity
					: Math.max(itemTotalGoal(item) - item.raised, 0);
			setAmount(Math.min(25, fundCap));
			setName("");
			setNote("");
			setStep("form");
			setChosenMethod(null);
		}
	}, [open, item]);

	if (!item) return null;

	const remaining = Math.max(itemTotalGoal(item) - item.raised, 0);
	// How much a single contribution can be. Items that allow overfunding can
	// go past their target; everything else is capped at what's left.
	const cap = (item.allowOverfunding ?? false) ? Infinity : remaining;
	const numericAmount = typeof amount === "number" ? amount : 0;
	// A name and a positive amount are required before paying.
	const canSubmit = numericAmount > 0 && name.trim().length > 0;

	function goToPay(e: React.FormEvent) {
		e.preventDefault();
		if (canSubmit) setStep("done");
	}

	function handlePay(method: PaymentMethod) {
		if (!item || !canSubmit) return;
		// window.open must run synchronously in the click handler (popup blockers).
		const url = paymentLinks(numericAmount, note)[method];
		window.open(url, "_blank", "noopener,noreferrer");
		setChosenMethod(method);
		setStep("done");
		// Persist + notify in the background; the UI doesn't wait on it.
		void Promise.resolve(
			onContribute({
				itemId: item.id,
				itemName: item.name,
				amount: numericAmount,
				name: name.trim(),
				note: note.trim() || undefined,
				method,
			}),
		).catch(() => {
			// Recording is best-effort; the guest has already been sent to pay.
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				{step === "done" ? (
					<div className="flex flex-col items-center gap-3 py-4 text-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-secondary">
							<PartyPopper className="size-7 text-clay" />
						</div>
						<DialogHeader className="items-center">
							<DialogTitle className="font-display text-2xl">
								Thank you so much! 💛
							</DialogTitle>
							<DialogDescription className="text-base">
								Thank you for sending {formatMoney(numericAmount)} toward{" "}
								<span className="font-semibold text-foreground">
									{item.name}
								</span>
								{"!"}
							</DialogDescription>
						</DialogHeader>
						{chosenMethod && (
							<Button
								variant="outline"
								className="rounded-full"
								onClick={() =>
									window.open(
										paymentLinks(numericAmount, note)[chosenMethod],
										"_blank",
										"noopener,noreferrer",
									)
								}
							>
								Reopen {PAYMENT_LABELS[chosenMethod]}
							</Button>
						)}
						<DialogClose asChild>
							<Button className="mt-1 rounded-full px-6">
								Back to the registry
							</Button>
						</DialogClose>
					</div>
				) : (
					<form onSubmit={goToPay}>
						<DialogHeader>
							<div className="mb-1 flex items-center gap-3">
								<span className="text-3xl" aria-hidden>
									{item.emoji}
								</span>
								<DialogTitle className="font-display text-xl">
									Contribute to {item.name}
								</DialogTitle>
							</div>
							<DialogDescription>
								You're chipping in money toward this gift — nothing is purchased
								here.{" "}
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
									{PRESET_AMOUNTS.map((preset) => {
										const overCap = preset > cap;
										return (
											<button
												key={preset}
												type="button"
												disabled={overCap}
												onClick={() => setAmount(preset)}
												className={cn(
													"cursor-pointer rounded-full border py-2 text-sm font-semibold transition-colors",
													overCap
														? "cursor-not-allowed border-border bg-card text-muted-foreground opacity-50"
														: amount === preset
															? "border-primary bg-primary text-primary-foreground"
															: "border-border bg-card hover:bg-muted",
												)}
											>
												${preset}
											</button>
										);
									})}
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
										max={cap === Infinity ? undefined : cap}
										inputMode="numeric"
										className="pl-7"
										value={amount}
										onChange={(e) => {
											if (e.target.value === "") {
												setAmount("");
												return;
											}
											setAmount(Math.min(Number(e.target.value), cap));
										}}
									/>
								</div>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="contributor-name">Your name</Label>
								<Input
									id="contributor-name"
									placeholder="Peter Piper"
									required
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
									className="min-h-28"
									rows={4}
									value={note}
									onChange={(e) => setNote(e.target.value)}
								/>
							</div>
						</div>

						<Label>Finish up</Label>
						{!canSubmit && (
							<p className="text-xs text-muted-foreground">
								Add your name and an amount to continue.
							</p>
						)}
						<DialogFooter className="gap-3 sm:gap-3 mt-2 sm:justify-start">
							<TooltipProvider delayDuration={150}>
								{METHOD_ORDER.map((method) => {
									const Icon = PAYMENT_ICONS[method];
									return (
										<Tooltip key={PAYMENT_LABELS[method]}>
											<TooltipTrigger asChild>
												<Button
													key={method}
													type="button"
													disabled={!canSubmit}
													onClick={() => handlePay(method)}
													className={cn(
														"flex items-center justify-center rounded-full text-base font-bold transition-all p-6",
														METHOD_STYLES[method],
													)}
												>
													<Icon className="size-6" />
												</Button>
											</TooltipTrigger>
											<TooltipContent className="max-w-xs text-center">
												{PAYMENT_LABELS[method]}
											</TooltipContent>
										</Tooltip>
									);
								})}
							</TooltipProvider>
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
