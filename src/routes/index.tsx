import { createFileRoute } from "@tanstack/react-router";
import { Gift, Sparkles } from "lucide-react";
import * as React from "react";

import { ContributeDialog } from "#/components/contribute-dialog.tsx";
import { RegistryItemCard } from "#/components/registry-item-card.tsx";
import { SiteFooter } from "#/components/site-footer.tsx";
import { SiteHeader } from "#/components/site-header.tsx";
import { Avatar, AvatarFallback } from "#/components/ui/avatar.tsx";
import { Card } from "#/components/ui/card.tsx";
import { Progress } from "#/components/ui/progress.tsx";
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
	CATEGORIES,
	COUPLE,
	REGISTRY_ITEMS,
	type RegistryItem,
} from "#/lib/registry-data.ts";

export const Route = createFileRoute("/")({ component: Home });

type Filter = "All" | (typeof CATEGORIES)[number];

type SortKey = "featured" | "most" | "least" | "name";

const SORT_LABELS: Record<SortKey, string> = {
	featured: "Featured",
	most: "Most funded",
	least: "Needs the most help",
	name: "Name (A–Z)",
};

function Home() {
	// Local, in-memory state so the contribute flow feels alive in this skeleton.
	// Swap this for a Convex query/mutation once we add the schema.
	const [items, setItems] = React.useState<RegistryItem[]>(REGISTRY_ITEMS);
	const [filter, setFilter] = React.useState<Filter>("All");
	const [sort, setSort] = React.useState<SortKey>("featured");
	const [hideFunded, setHideFunded] = React.useState(false);
	const [activeItem, setActiveItem] = React.useState<RegistryItem | null>(null);
	const [dialogOpen, setDialogOpen] = React.useState(false);

	const totalGoal = items.reduce((sum, i) => sum + i.goal, 0);
	const totalRaised = items.reduce(
		(sum, i) => sum + Math.min(i.raised, i.goal),
		0,
	);
	const overallPct = Math.round((totalRaised / totalGoal) * 100);
	const fundedCount = items.filter((i) => i.raised >= i.goal).length;

	const visibleItems = React.useMemo(() => {
		const pct = (i: RegistryItem) => i.raised / i.goal;
		let list =
			filter === "All" ? items : items.filter((i) => i.category === filter);
		if (hideFunded) list = list.filter((i) => i.raised < i.goal);
		switch (sort) {
			case "most":
				list = [...list].sort((a, b) => pct(b) - pct(a));
				break;
			case "least":
				list = [...list].sort((a, b) => pct(a) - pct(b));
				break;
			case "name":
				list = [...list].sort((a, b) => a.name.localeCompare(b.name));
				break;
		}
		return list;
	}, [items, filter, sort, hideFunded]);

	function openContribute(item: RegistryItem) {
		setActiveItem(item);
		setDialogOpen(true);
	}

	function handleContribute(itemId: string, amount: number) {
		setItems((prev) =>
			prev.map((i) =>
				i.id === itemId ? { ...i, raised: i.raised + amount } : i,
			),
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			<SiteHeader />

			<main className="flex-1">
				{/* Hero */}
				<section className="page-wrap pt-12 pb-8 text-center sm:pt-16">
					<div className="rise-in mx-auto flex max-w-2xl flex-col items-center">
						<span className="kicker">
							<Sparkles className="size-3.5" />
							{COUPLE.arrivalLabel}
						</span>

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

						<h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
							{COUPLE.title}{" "}
							<span className="text-sage-deep">{COUPLE.year}</span>
						</h1>
						<p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
							{COUPLE.note}
						</p>
					</div>

					{/* Overall progress card */}
					<Card className="rise-in mx-auto mt-10 max-w-2xl p-6 text-left">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-2">
								<span className="flex size-9 items-center justify-center rounded-full bg-secondary">
									<Gift className="size-4 text-secondary-foreground" />
								</span>
								<div>
									<p className="font-display font-bold leading-tight">
										${totalRaised.toLocaleString()} raised
									</p>
									<p className="text-sm text-muted-foreground">
										of ${totalGoal.toLocaleString()} goal · {fundedCount} of{" "}
										{items.length} fully funded
									</p>
								</div>
							</div>
							<span className="font-display text-2xl font-bold text-sage-deep">
								{overallPct}%
							</span>
						</div>
						<Progress value={overallPct} className="mt-4 h-3 bg-muted" />
					</Card>
				</section>

				{/* Category filter + controls */}
				<section className="page-wrap space-y-4 pt-4">
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
								<SelectTrigger className="w-[200px] rounded-full bg-card">
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

				{/* Item grid */}
				<section className="page-wrap pt-8 pb-4">
					{visibleItems.length > 0 ? (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{visibleItems.map((item) => (
								<RegistryItemCard
									key={item.id}
									item={item}
									onContribute={openContribute}
								/>
							))}
						</div>
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
