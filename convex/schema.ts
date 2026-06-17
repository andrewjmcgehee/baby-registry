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
  }),

  // Guests can ONLY contribute money — never purchase. Each contribution is a
  // row here; an item's `raised` total is the sum of its contributions.
  contributions: defineTable({
    itemId: v.id('registryItems'),
    /** Dollars contributed. */
    amount: v.number(),
    name: v.optional(v.string()),
    note: v.optional(v.string()),
  }).index('by_item', ['itemId']),
})
