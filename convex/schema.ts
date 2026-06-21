import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/** Allowed registry categories — kept in sync with src/lib/registry-data.ts. */
export const categoryValidator = v.union(
  v.literal('Feeding'),
  v.literal('Sleeping'),
  v.literal('Diapering'),
  v.literal('Gear'),
  v.literal('Health & Safety'),
  v.literal('Bathing'),
  v.literal('Nursery'),
  v.literal('Playing'),
  v.literal('Growing Up'),
  v.literal('For the Parents'),
)

/** Pastel tile color keys for the emoji tiles. */
export const tintValidator = v.union(
  v.literal('sage'),
  v.literal('honey'),
  v.literal('clay'),
  v.literal('sky'),
)

export default defineSchema({
  registryItems: defineTable({
    name: v.string(),
    emoji: v.string(),
    blurb: v.string(),
    category: categoryValidator,
    /** Price of a single unit, in whole dollars. Total target = price × count. */
    price: v.number(),
    /** Quantity wanted, e.g. 3 plates at $15 each. Defaults to 1. */
    count: v.number(),
    tint: tintValidator,
    /** Stable display order in the grid. */
    order: v.number(),
    /**
     * If true, the item keeps accepting contributions past its target.
     * Most items are false (they "close" once fully funded). Optional so
     * existing rows validate; treated as false when absent.
     */
    allowOverfunding: v.optional(v.boolean()),
    /**
     * If true, the "contribute toward anything" quick-give button skips this
     * item when picking the neediest gift (e.g. an open-ended college fund).
     */
    excludeFromAnything: v.optional(v.boolean()),
  }),

  // Guests can ONLY contribute money — never purchase. Each contribution is a
  // row here; an item's `raised` total is the sum of its contributions.
  contributions: defineTable({
    itemId: v.id('registryItems'),
    /** Dollars contributed. */
    amount: v.number(),
    /** Contributor's name — required so we know who to thank. */
    name: v.string(),
    note: v.optional(v.string()),
    /** Which app they said they'd pay with: 'venmo' | 'paypal' | 'cashapp'. */
    method: v.optional(v.string()),
    /**
     * Contributions start pending because they aren't actually linked to a
     * payment provider (Venmo/PayPal/etc.) — guests just *say* they'll pay.
     * An admin manually confirms each one (sets this false) once the money
     * actually arrives. Optional so existing rows validate; absent is treated
     * as pending, so only confirmed contributions count toward an item's total.
     */
    pending: v.optional(v.boolean()),
  }).index('by_item', ['itemId']),
})
