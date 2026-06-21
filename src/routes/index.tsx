import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Baby,
	ChevronLeft,
	ChevronRight,
	Gift,
	Info,
	Loader2,
} from "lucide-react";
import * as React from "react";
import {
	ContributeDialog,
	type ContributionPayload,
} from "#/components/contribute-dialog.tsx";
import { FundingBar } from "#/components/funding-bar.tsx";
import { RegistryItemCard } from "#/components/registry-item-card.tsx";
import { SiteFooter } from "#/components/site-footer.tsx";
import { SiteHeader } from "#/components/site-header.tsx";
import { Avatar, AvatarFallback } from "#/components/ui/avatar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { Switch } from "#/components/ui/switch.tsx";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip.tsx";
import {
	CATEGORIES,
	COUPLE,
	itemTotalGoal,
	type RegistryItem,
} from "#/lib/registry-data.ts";
import { cn } from "#/lib/utils.ts";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { notifyPayment } from "../server/notify";

export const Route = createFileRoute("/")({ component: Home });

type Filter = "All" | (typeof CATEGORIES)[number];

type SortKey = "featured" | "most" | "least" | "name";

const SORT_LABELS: Record<SortKey, string> = {
	featured: "Featured",
	most: "Most funded",
	least: "Needs the most help",
	name: "Name (A–Z)",
};

const PAGE_SIZE = 9;

function Home() {
	// Live data from Convex. `listItems` returns each item with its `raised`
	// total summed from the contributions table.
	const { data, isPending } = useQuery(convexQuery(api.registry.listItems, {}));
	const items = data ?? [];
	const addContribution = useConvexMutation(api.registry.addContribution);

	const [filter, setFilter] = React.useState<Filter>("All");
	const [sort, setSort] = React.useState<SortKey>("featured");
	const [hideFunded, setHideFunded] = React.useState(false);
	const [activeItem, setActiveItem] = React.useState<RegistryItem | null>(null);
	const [dialogOpen, setDialogOpen] = React.useState(false);

	const totalGoal = items.reduce((sum, i) => sum + itemTotalGoal(i), 0);
	const totalRaised = items.reduce(
		(sum, i) => sum + Math.min(i.raised, itemTotalGoal(i)),
		0,
	);
	// Pending money toward each item, capped at that item's remaining gap so an
	// over-pledged gift can't inflate the overall bar past its goal.
	const totalPending = items.reduce(
		(sum, i) =>
			sum + Math.min(i.pending ?? 0, Math.max(0, itemTotalGoal(i) - i.raised)),
		0,
	);
	// Keep one decimal of precision for the primary progress bar.
	const overallPct = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;
	const overallPendingPct =
		totalGoal > 0
			? Math.min((totalPending / totalGoal) * 100, 100 - overallPct)
			: 0;
	const fundedCount = items.filter((i) => i.raised >= itemTotalGoal(i)).length;

	const visibleItems = React.useMemo(() => {
		// Dollars still needed to fully fund an item, floored at 0.
		const remaining = (i: RegistryItem) =>
			Math.max(0, itemTotalGoal(i) - i.raised);
		let list =
			filter === "All" ? items : items.filter((i) => i.category === filter);
		if (hideFunded) list = list.filter((i) => i.raised < itemTotalGoal(i));
		switch (sort) {
			case "most":
				// Most funded → smallest remaining first (inverse of "least").
				list = [...list].sort((a, b) => remaining(a) - remaining(b));
				break;
			case "least":
				// Needs the most help → largest remaining first.
				list = [...list].sort((a, b) => remaining(b) - remaining(a));
				break;
			case "name":
				list = [...list].sort((a, b) => a.name.localeCompare(b.name));
				break;
		}
		return list;
	}, [items, filter, sort, hideFunded]);

	// Client-side pagination over the already-filtered/sorted list.
	const [page, setPage] = React.useState(0);
	// Jump back to the first page whenever the result set changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on filter changes
	React.useEffect(() => {
		setPage(0);
	}, [filter, sort, hideFunded]);

	const pageCount = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
	// Clamp in case the list shrank (e.g. an item became "funded" while hidden).
	const currentPage = Math.min(page, pageCount - 1);
	const pagedItems = visibleItems.slice(
		currentPage * PAGE_SIZE,
		currentPage * PAGE_SIZE + PAGE_SIZE,
	);

	const cardsRef = React.useRef<HTMLElement>(null);
	function goToPage(next: number) {
		setPage(Math.max(0, Math.min(pageCount - 1, next)));
		cardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function openContribute(item: RegistryItem) {
		setActiveItem(item);
		setDialogOpen(true);
	}

	// Persist the contribution (Convex live-subscription updates `raised`), then
	// fire the Slack ping in the background.
	async function handleContribute(payload: ContributionPayload) {
		await addContribution({
			itemId: payload.itemId as Id<"registryItems">,
			amount: payload.amount,
			name: payload.name,
			note: payload.note,
			method: payload.method,
		});
		void notifyPayment({
			data: {
				itemName: payload.itemName,
				amount: payload.amount,
				name: payload.name,
				note: payload.note,
				method: payload.method,
			},
		}).catch(() => {
			// Slack ping is best-effort — never block the contribution flow.
		});
	}

	// "Contribute toward anything" targets the item with the largest funding gap,
	// skipping any item flagged excludeFromAnything (e.g. the college fund).
	const neediest = [...items]
		.filter((i) => !i.excludeFromAnything && i.raised < itemTotalGoal(i))
		.sort(
			(a, b) => itemTotalGoal(b) - b.raised - (itemTotalGoal(a) - a.raised),
		)[0];

	return (
		<div className="flex min-h-screen flex-col">
			<SiteHeader />

			<main className="flex-1">
				{/* Hero */}
				<section className="page-wrap pt-12 pb-8 text-center sm:pt-16">
					<div className="rise-in mx-auto flex max-w-2xl flex-col items-center">
						<div className="mt-6 flex -space-x-3">
							<Avatar className="size-14 border-2 border-card shadow-sm">
								<AvatarFallback className="bg-sage text-lg font-bold text-primary-foreground">
									{COUPLE.parentOne[0]}
								</AvatarFallback>
							</Avatar>
							<Avatar className="size-14 border-2 border-card shadow-sm">
								<AvatarFallback className="bg-clay text-lg font-bold text-primary-foreground">
									{COUPLE.parentTwo[0]}
								</AvatarFallback>
							</Avatar>
						</div>

						<span className="kicker mt-6">
							<Baby className="size-3.5" />
							{COUPLE.arrivalLabel}
						</span>

						<h1 className="mt-5 font-display text-3xl font-bold tracking-tighter sm:text-5xl">
							We're having a baby!
						</h1>
						<p className="mt-6 hidden leading-relaxed text-ink-soft sm:block">
							We're so grateful for your help welcoming the newest McGehee! 💛
							<br />
							To save y'all the shipping costs to Texas, we're doing our
							registry a little differently.
							<br />
							We're kindly requesting monetary gifts in lieu of presents.
						</p>
					</div>

					{/* Overall progress card */}
					{items.length > 0 && (
						<Card className="rise-in mx-auto mt-10 max-w-2xl p-6 text-left">
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-2">
									<span className="flex size-9 items-center justify-center rounded-full bg-secondary">
										<Gift className="size-4 text-secondary-foreground" />
									</span>
									<div>
										<p className="font-display font-bold leading-tight">
											${totalRaised.toLocaleString()} raised ·{" "}
											<span className="text-muted-foreground">
												${totalPending.toLocaleString()} pending
											</span>
										</p>
										<p className="text-sm text-muted-foreground">
											${totalGoal.toLocaleString()} goal · {fundedCount} of{" "}
											{items.length} fully funded
										</p>
									</div>
								</div>
								<span className="font-display text-2xl font-bold text-sage-deep">
									{(overallPct + overallPendingPct).toFixed(1)}%
								</span>
							</div>
							<FundingBar
								confirmedPct={overallPct}
								pendingPct={overallPendingPct}
								className="mt-4 h-3"
							/>
						</Card>
					)}

					{neediest && (
						<div className="mt-6 flex items-center justify-center gap-2">
							<Button
								size="lg"
								className="rounded-full"
								onClick={() => openContribute(neediest)}
							>
								<Gift className="size-4" />
								Contribute toward anything
							</Button>
							<TooltipProvider delayDuration={150}>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											aria-label="How this works"
											className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
										>
											<Info className="size-4" />
										</button>
									</TooltipTrigger>
									<TooltipContent className="text-center">
										We'll automatically allocate your gift to whatever needs the
										most help!
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					)}
				</section>

				{/* Category filter + controls */}
				{items.length > 0 && (
					<section className="hidden page-wrap space-y-4 pt-4 sm:block">
						<Tabs
							value={filter}
							onValueChange={(value) => setFilter(value as Filter)}
						>
							<TabsList variant="pill">
								{(["All", ...CATEGORIES] as Filter[]).map((cat) => (
									<TabsTrigger key={cat} value={cat}>
										{cat}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>

						<div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
							<label
								htmlFor="hide-funded"
								className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-muted-foreground"
							>
								<Switch
									id="hide-funded"
									checked={hideFunded}
									onCheckedChange={setHideFunded}
								/>
								Hide fully funded gifts
							</label>

							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-muted-foreground">
									Sort
								</span>
								<Select
									value={sort}
									onValueChange={(value) => setSort(value as SortKey)}
								>
									<SelectTrigger className="w-50 rounded-full bg-card">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
											<SelectItem key={key} value={key}>
												{SORT_LABELS[key]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</section>
				)}

				{/* Item grid */}
				<section ref={cardsRef} className="page-wrap scroll-mt-24 sm:pt-8 pb-4">
					{isPending ? (
						<p className="flex items-center justify-center py-12 text-muted-foreground">
							<Loader2 className="mr-2 size-4 animate-spin" />
							Loading the registry…
						</p>
					) : items.length === 0 ? (
						<div className="soft-card mx-auto max-w-md p-10 text-center">
							<div className="text-5xl">🍼</div>
							<h2 className="mt-4 font-display text-xl font-bold">
								The registry is on its way!
							</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								{COUPLE.parentOne} &amp; {COUPLE.parentTwo} are still adding
								their wishes. Check back soon to chip in. 💛
							</p>
						</div>
					) : visibleItems.length > 0 ? (
						<>
							<Pager
								currentPage={currentPage}
								pageCount={pageCount}
								onChange={goToPage}
								className="mb-8"
							/>
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{pagedItems.map((item) => (
									<RegistryItemCard
										key={item.id}
										item={item}
										onContribute={openContribute}
									/>
								))}
							</div>
							<Pager
								currentPage={currentPage}
								pageCount={pageCount}
								onChange={goToPage}
								className="mt-10"
							/>
						</>
					) : (
						<p className="py-12 text-center text-muted-foreground">
							Every gift here is fully funded — thank you! 💛
						</p>
					)}
				</section>
			</main>

			<SiteFooter />

			<ContributeDialog
				item={activeItem}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onContribute={handleContribute}
			/>
		</div>
	);
}

function Pager({
	currentPage,
	pageCount,
	onChange,
	className,
}: {
	currentPage: number;
	pageCount: number;
	/** Receives the requested absolute page index (zero-based). */
	onChange: (page: number) => void;
	className?: string;
}) {
	if (pageCount <= 1) return null;
	return (
		<div className={cn("flex items-center justify-center gap-4", className)}>
			<Button
				variant="outline"
				size="sm"
				className="rounded-full"
				onClick={() => onChange(currentPage - 1)}
				disabled={currentPage === 0}
			>
				<ChevronLeft className="size-4" />
				Prev
			</Button>
			<span className="text-sm font-semibold text-muted-foreground">
				Page {currentPage + 1} of {pageCount}
			</span>
			<Button
				variant="outline"
				size="sm"
				className="rounded-full"
				onClick={() => onChange(currentPage + 1)}
				disabled={currentPage >= pageCount - 1}
			>
				Next
				<ChevronRight className="size-4" />
			</Button>
		</div>
	);
}
