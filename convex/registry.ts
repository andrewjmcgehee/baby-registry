import { v } from 'convex/values'

import { internalMutation, mutation, query } from './_generated/server'
import { categoryValidator, tintValidator } from './schema'

/**
 * List every registry item with its live `raised` total (sum of contributions).
 * Shaped to match the frontend RegistryItem type — note `id` instead of `_id`.
 */
export const listItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query('registryItems').collect()

    const withTotals = await Promise.all(
      items.map(async (item) => {
        const contributions = await ctx.db
          .query('contributions')
          .withIndex('by_item', (q) => q.eq('itemId', item._id))
          .collect()
        const raised = contributions.reduce((sum, c) => sum + c.amount, 0)

        return {
          id: item._id,
          name: item.name,
          emoji: item.emoji,
          blurb: item.blurb,
          category: item.category,
          price: item.price,
          count: item.count,
          tint: item.tint,
          order: item.order,
          allowOverfunding: item.allowOverfunding ?? false,
          excludeFromAnything: item.excludeFromAnything ?? false,
          raised,
        }
      }),
    )

    return withTotals.sort((a, b) => a.order - b.order)
  },
})

/** Record a money contribution toward an item. Nothing is ever "purchased." */
export const addContribution = mutation({
  args: {
    itemId: v.id('registryItems'),
    amount: v.number(),
    name: v.optional(v.string()),
    note: v.optional(v.string()),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error('Contribution amount must be greater than zero.')
    }
    const item = await ctx.db.get(args.itemId)
    if (!item) {
      throw new Error('Registry item not found.')
    }

    return await ctx.db.insert('contributions', {
      itemId: args.itemId,
      amount: Math.round(args.amount),
      name: args.name?.trim() || undefined,
      note: args.note?.trim() || undefined,
      method: args.method?.trim() || undefined,
    })
  },
})

/**
 * Public "friendly notes" wall: contributions that left a note. Returns only
 * the name + note (never the amount), newest first.
 */
export const listNotes = query({
  args: {},
  handler: async (ctx) => {
    const contributions = await ctx.db
      .query('contributions')
      .order('desc')
      .collect()

    return contributions
      .filter((c) => c.note && c.note.trim().length > 0)
      .map((c) => ({
        id: c._id,
        name: c.name ?? null,
        note: c.note as string,
        createdAt: c._creationTime,
      }))
  },
})

/**
 * One-time seed for the starter registry. Not run automatically — invoke it
 * yourself when you want to populate the dev deployment, e.g.:
 *
 *   pnpm dlx convex run registry:seed
 *
 * Safe to call repeatedly: it no-ops if items already exist.
 */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('registryItems').first()
    if (existing) {
      return { inserted: 0, message: 'Registry already has items; skipped.' }
    }

    let order = 0
    for (const item of SEED_ITEMS) {
      // count defaults to 1 unless an item overrides it.
      await ctx.db.insert('registryItems', { count: 1, ...item, order: order++ })
    }
    return { inserted: SEED_ITEMS.length, message: 'Seeded starter registry.' }
  },
})

/**
 * Destructive reseed for development: wipes every registry item (and its
 * contributions) and re-inserts the current SEED_ITEMS. Use this when you've
 * edited SEED_ITEMS and want the table to reflect the new list:
 *
 *   pnpm dlx convex run registry:reseed
 */
export const reseed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query('registryItems').collect()
    for (const item of items) {
      const contributions = await ctx.db
        .query('contributions')
        .withIndex('by_item', (q) => q.eq('itemId', item._id))
        .collect()
      for (const c of contributions) await ctx.db.delete(c._id)
      await ctx.db.delete(item._id)
    }

    let order = 0
    for (const item of SEED_ITEMS) {
      await ctx.db.insert('registryItems', { count: 1, ...item, order: order++ })
    }
    return {
      deleted: items.length,
      inserted: SEED_ITEMS.length,
      message: 'Reseeded registry from SEED_ITEMS.',
    }
  },
})

// Inlined here because Convex functions can't import from src/.
const SEED_ITEMS: Array<{
  name: string
  emoji: string
  blurb: string
  category: typeof categoryValidator.type
  price: number
  count?: number
  tint: typeof tintValidator.type
  allowOverfunding?: boolean
  excludeFromAnything?: boolean
}> = [
  {
    name: 'Nursing Pillow',
    emoji: '👩🏻‍🍼',
    blurb: 'A cozy pillow for baby to breastfeed on.',
    category: 'Feeding',
    price: 50,
    tint: 'sage',
  },
  {
    name: 'Breast Milk Storage Bags',
    emoji: '🍼',
    blurb: 'Freezer safe storage bags for breast milk.',
    category: 'Feeding',
    price: 20,
    tint: 'sky',
  },
  {
    name: 'Bottle Drying Rack',
    emoji: '🍼',
    blurb: "A small rack for drying baby's cleaned bottles.",
    category: 'Feeding',
    price: 50,
    tint: 'clay',
  },
  {
    name: 'Silicone Feeding Spoons',
    emoji: '🥄',
    blurb: "Soft spoons to keep baby's mouth safe when feeding.",
    category: 'Feeding',
    price: 10,
    count: 3,
    tint: 'honey',
  },
  {
    name: 'Silicone Suction Plates',
    emoji: '🍽️',
    blurb: 'Soft plates that stick to table tops to prevent more mess.',
    category: 'Feeding',
    price: 15,
    count: 3,
    tint: 'sage',
  },
  {
    name: 'Bibs',
    emoji: '🫟',
    blurb: "To keep baby's clothes clean when eating.",
    category: 'Feeding',
    price: 5,
    count: 4,
    tint: 'sky',
  },
  {
    name: 'Glass Baby Bottles',
    emoji: '🍼',
    blurb: "High quality bottles and no plastic!",
    category: 'Feeding',
    price: 50,
    tint: 'honey',
  },
  {
    name: 'Teething Toothbrush',
    emoji: '🦷',
    blurb: "Something to help baby's teeth feel better.",
    category: 'Growing Up',
    price: 5,
    tint: 'clay',
  },
  {
    name: 'Burp Cloths',
    emoji: '🫧',
    blurb: 'For yucky spit ups.',
    category: 'Feeding',
    price: 20,
    count: 2,
    tint: 'sage',
  },
  {
    name: 'Sipee Cups',
    emoji: '🍼',
    blurb: 'Spill safe cups to keep baby hydrated.',
    category: 'Feeding',
    price: 10,
    tint: 'sky',
  },
  {
    name: 'High Chair',
    emoji: '🪑',
    blurb: 'An 8-in-1 high chair for all the phases of eating at the table.',
    category: 'Feeding',
    price: 150,
    tint: 'honey',
  },
  {
    name: 'Lanolin Cream',
    emoji: '🧴',
    blurb: "For when mommy's skin gets too sensitive or sore.",
    category: 'For the Parents',
    price: 10,
    tint: 'clay',
  },
  {
    name: 'Swaddling Cloths & Sheets',
    emoji: '🥱',
    blurb: 'To keep the baby warm and snug.',
    category: 'Sleeping',
    price: 40,
    tint: 'sage',
  },
  {
    name: 'Pack & Play',
    emoji: '🐣',
    blurb: 'A cozy playpen for baby to sleep and have tummy time.',
    category: 'Sleeping',
    price: 300,
    tint: 'honey',
  },
  {
    name: 'Pack & Play Mosquito Cover',
    emoji: '🦟',
    blurb: 'To keep the nasty Texas bugs out.',
    category: 'Sleeping',
    price: 20,
    tint: 'sky',
  },
  {
    name: 'Bedside Bassinet',
    emoji: '🧺',
    blurb: 'So baby can sleep next to mommy and daddy.',
    category: 'Sleeping',
    price: 250,
    tint: 'clay',
  },
  {
    name: 'Baby Monitor',
    emoji: '📻',
    blurb: 'In case baby needs to tell us something.',
    category: 'Sleeping',
    price: 40,
    tint: 'sage',
  },
  {
    name: 'Diaper Bag',
    emoji: '👜',
    blurb: 'So we are always prepared for poo-plosions.',
    category: 'Diapering',
    price: 75,
    tint: 'honey',
  },
  {
    name: 'Changing Pad',
    emoji: '🧽',
    blurb: 'A portable, sanitary place to change diapers.',
    category: 'Diapering',
    price: 150,
    tint: 'sky',
  },
  {
    name: 'Wipes',
    emoji: '🧻',
    blurb: 'For doing the dirty.',
    category: 'Diapering',
    price: 10,
    count: 3,
    tint: 'clay',
  },
  {
    name: 'Diapers',
    emoji: '🐣',
    blurb: 'We are buying reusable and washable cloth diapers.',
    category: 'Diapering',
    price: 300,
    tint: 'sage',
  },
  {
    name: 'Diaper Fasteners',
    emoji: '🧷',
    blurb: "To keep baby's draws up.",
    category: 'Diapering',
    price: 10,
    tint: 'honey',
  },
  {
    name: 'Stroller',
    emoji: '🛒',
    blurb: 'Oh the places baby will go.',
    category: 'Gear',
    price: 200,
    tint: 'sky',
  },
  {
    name: 'Baby Chest Carrier',
    emoji: '🎒',
    blurb: 'So daddy can show off baby to the world.',
    category: 'Gear',
    price: 100,
    tint: 'clay',
  },
  {
    name: 'Car Seat',
    emoji: '💺',
    blurb: 'We found an awesome car seat that will last.',
    category: 'Gear',
    price: 300,
    tint: 'sage',
  },
  {
    name: 'Pacifiers',
    emoji: '🍼',
    blurb: 'To shut that baby up for our mental health.',
    category: 'Health & Safety',
    price: 15,
    tint: 'honey',
  },
  {
    name: 'Baby Gates',
    emoji: '🔒',
    blurb: 'Oh the places baby will not go.',
    category: 'Health & Safety',
    price: 75,
    tint: 'sky',
  },
  {
    name: 'Outlet Covers & Magnetic Drawer Locks',
    emoji: '⚡️',
    blurb: "Don't you touch that!",
    category: 'Health & Safety',
    price: 40,
    tint: 'clay',
  },
  {
    name: 'Baby Comb and Brush',
    emoji: '🪮',
    blurb: "Keep baby's hair looking ridiculously good looking.",
    category: 'Health & Safety',
    price: 10,
    tint: 'sage',
  },
  {
    name: 'Nasal Aspirator',
    emoji: '🐽',
    blurb: "For those tough boogeys that won't come out.",
    category: 'Health & Safety',
    price: 20,
    tint: 'honey',
  },
  {
    name: 'Baby Thermometer',
    emoji: '🌡️',
    blurb: 'No fevers please.',
    category: 'Health & Safety',
    price: 15,
    tint: 'sky',
  },
  {
    name: 'Bath Toys',
    emoji: '🐤',
    blurb: 'You sank my battleship!',
    category: 'Bathing',
    price: 20,
    tint: 'clay',
  },
  {
    name: 'Baby Towel',
    emoji: '🧺',
    blurb: "It's in the shape of a frog. ☺️",
    category: 'Bathing',
    price: 20,
    tint: 'sage',
  },
  {
    name: 'Baby Tub',
    emoji: '🛁',
    blurb: 'Stinky.',
    category: 'Bathing',
    price: 40,
    tint: 'honey',
  },
  {
    name: 'Goose Rocker',
    emoji: '🪿',
    blurb: 'The cutest baby rocker in the shape of a goose!',
    category: 'Nursery',
    price: 150,
    tint: 'sky',
  },
  {
    name: 'Baby Clothes',
    emoji: '👕',
    blurb: "Because it turns out you can't be naked forever.",
    category: 'Growing Up',
    price: 50,
    tint: 'clay',
  },
  {
    name: 'The Nugget',
    emoji: '🛋️',
    blurb: 'A cute couch for babies through pre-teens.',
    category: 'Nursery',
    price: 275,
    tint: 'sage',
  },
  {
    name: 'The Chunk',
    emoji: '🪑',
    blurb: 'A cute ottoman with storage for babies through pre-teens.',
    category: 'Nursery',
    price: 200,
    tint: 'honey',
  },
  {
    name: 'Rattles',
    emoji: '🪇',
    blurb: 'To drive us crazy.',
    category: 'Playing',
    price: 40,
    tint: 'sky',
  },
  {
    name: 'Reclining Nursing Rocker',
    emoji: '🪑',
    blurb: 'For mommy to nurse and sleep.',
    category: 'For the Parents',
    price: 1000,
    tint: 'clay',
  },
  {
    name: 'Training Potty',
    emoji: '🚽',
    blurb: 'To get an early start on potty training.',
    category: 'Growing Up',
    price: 30,
    tint: 'sage',
  },
  {
    name: 'Play Table',
    emoji: '🖍️',
    blurb: 'For baby to draw and play and make a mess.',
    category: 'Playing',
    price: 100,
    tint: 'honey',
  },
  {
    name: 'Climbing Set',
    emoji: '🧗🏻',
    blurb: "For when the monkey can't be contained any longer.",
    category: 'Playing',
    price: 100,
    tint: 'sky',
  },
  {
    name: 'College Fund Starter',
    emoji: '🎓',
    blurb: 'Never too early I guess.',
    category: 'Growing Up',
    price: 1000,
    tint: 'clay',
  },
]
