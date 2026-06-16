/**
 * Mock registry data for Andrew & Marisa's Baby 2026.
 *
 * NOTE: This is a frontend-only skeleton. Guests can ONLY contribute money
 * toward an item's funding goal — nothing here can actually be purchased.
 * When we're ready to persist contributions, this maps cleanly onto a Convex
 * `registryItems` + `contributions` schema (see notes at the bottom).
 */

export type RegistryCategory =
	| "Nursery"
	| "On the Go"
	| "Essentials"
	| "Feeding"
	| "Playtime"
	| "Big Dreams";

export interface RegistryItem {
	id: string;
	name: string;
	/** A playful emoji stand-in until we wire up real product photos. */
	emoji: string;
	blurb: string;
	category: RegistryCategory;
	/** Funding goal in whole dollars. */
	goal: number;
	/** Dollars contributed so far. */
	raised: number;
	/** Pastel tile color key, see TILE_TINTS below. */
	tint: TileTint;
}

export type TileTint = "sage" | "honey" | "clay" | "sky";

export const TILE_TINTS: Record<TileTint, { bg: string; ring: string }> = {
	sage: { bg: "var(--sage-soft)", ring: "var(--sage)" },
	honey: { bg: "var(--honey-soft)", ring: "var(--honey)" },
	clay: { bg: "var(--clay-soft)", ring: "var(--clay)" },
	sky: { bg: "var(--sky-soft)", ring: "var(--sky)" },
};

export const COUPLE = {
	parentOne: "Andrew",
	parentTwo: "Marisa",
	title: "Andrew & Marisa's Baby",
	year: 2026,
	// A warm, gender-neutral note from the parents-to-be.
	note: "We're keeping the nursery a surprise! Instead of gifts, we'd be so grateful for a little help making our home ready for the newest McGehee. Every dollar — big or small — means the world to us. 💛",
	arrivalLabel: "Arriving Autumn 2026",
};

export const CATEGORIES: RegistryCategory[] = [
	"Nursery",
	"On the Go",
	"Essentials",
	"Feeding",
	"Playtime",
	"Big Dreams",
];

export const REGISTRY_ITEMS: RegistryItem[] = [
	{
		id: "crib",
		name: "Convertible Crib",
		emoji: "🛏️",
		blurb:
			"A cozy crib that grows into a toddler bed — sweet dreams for years to come.",
		category: "Nursery",
		goal: 499,
		raised: 320,
		tint: "sage",
	},
	{
		id: "mattress",
		name: "Organic Crib Mattress",
		emoji: "🌙",
		blurb:
			"Breathable, non-toxic, and just-right firm for safe little-one sleep.",
		category: "Nursery",
		goal: 180,
		raised: 95,
		tint: "sky",
	},
	{
		id: "glider",
		name: "Rocking Glider Chair",
		emoji: "🪑",
		blurb: "For 2am feedings, lullabies, and a thousand snuggles in between.",
		category: "Nursery",
		goal: 350,
		raised: 60,
		tint: "clay",
	},
	{
		id: "carrier",
		name: "Soft-Structured Baby Carrier",
		emoji: "🧸",
		blurb: "Keep baby close and hands free on every little adventure.",
		category: "On the Go",
		goal: 160,
		raised: 160,
		tint: "honey",
	},
	{
		id: "stroller",
		name: "Stroller + Car Seat Travel System",
		emoji: "🚼",
		blurb:
			"One smooth-rolling system for strolls, errands, and first road trips.",
		category: "On the Go",
		goal: 420,
		raised: 135,
		tint: "sage",
	},
	{
		id: "monitor",
		name: "Video Baby Monitor",
		emoji: "📷",
		blurb: "A little peace of mind so we can peek in without a peep.",
		category: "Essentials",
		goal: 200,
		raised: 200,
		tint: "sky",
	},
	{
		id: "diapers",
		name: "Diaper Fund (6 months)",
		emoji: "🧷",
		blurb: "The least glamorous gift — and somehow the most appreciated.",
		category: "Essentials",
		goal: 300,
		raised: 145,
		tint: "honey",
	},
	{
		id: "bottle-warmer",
		name: "Bottle Warmer",
		emoji: "🍼",
		blurb: "Warm bottles in a blink — fewer tears all around.",
		category: "Feeding",
		goal: 60,
		raised: 25,
		tint: "clay",
	},
	{
		id: "high-chair",
		name: "Convertible High Chair",
		emoji: "🥄",
		blurb: "For the gloriously messy era of first foods.",
		category: "Feeding",
		goal: 150,
		raised: 0,
		tint: "sage",
	},
	{
		id: "play-mat",
		name: "Soft Play Mat",
		emoji: "🧩",
		blurb: "A squishy little world for tummy time and giggles.",
		category: "Playtime",
		goal: 90,
		raised: 45,
		tint: "sky",
	},
	{
		id: "books",
		name: "Library Starter Bundle",
		emoji: "📚",
		blurb: "Board books to read aloud before bed (over and over and over).",
		category: "Playtime",
		goal: 120,
		raised: 70,
		tint: "honey",
	},
	{
		id: "college-fund",
		name: "College Fund Kickoff",
		emoji: "🎓",
		blurb:
			"A tiny seed for someday-big dreams. Future grad thanks you in advance!",
		category: "Big Dreams",
		goal: 1000,
		raised: 275,
		tint: "clay",
	},
];

/**
 * Future Convex shape (ask before creating the schema):
 *
 *   registryItems: { name, emoji, blurb, category, goal, tint }
 *   contributions: { itemId: v.id('registryItems'), amount, name?, note?, createdAt }
 *
 * `raised` would then be derived by summing contributions per item.
 */
