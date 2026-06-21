import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

// Convex provides `process.env` at runtime, but its tsconfig omits Node types.
declare const process: { env: Record<string, string | undefined> }

/**
 * Admin-only Convex functions. These are NOT meant to be called from the
 * browser — they require a server-only shared secret (the `ADMIN_SECRET`
 * environment variable on this Convex deployment) that only the web server
 * knows. The admin page reaches these through TanStack server functions.
 */
function assertSecret(secret: string) {
  const expected = process.env.ADMIN_SECRET
  if (!expected) {
    throw new Error('ADMIN_SECRET is not configured on the Convex deployment.')
  }
  // Constant-time comparison to avoid leaking the secret via timing.
  if (secret.length !== expected.length) {
    throw new Error('Unauthorized')
  }
  let diff = 0
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (diff !== 0) {
    throw new Error('Unauthorized')
  }
}

/** Every contribution, newest first, joined with its item's name. */
export const listContributions = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    assertSecret(secret)

    const contributions = await ctx.db
      .query('contributions')
      .order('desc')
      .collect()

    const items = await ctx.db.query('registryItems').collect()
    const nameById = new Map(items.map((i) => [i._id, i.name]))

    return contributions.map((c) => ({
      id: c._id,
      itemId: c.itemId,
      itemName: nameById.get(c.itemId) ?? '(deleted item)',
      amount: c.amount,
      name: c.name,
      note: c.note ?? null,
      method: c.method ?? null,
      // Absent `pending` (legacy rows) is treated as still pending.
      pending: c.pending ?? true,
      createdAt: c._creationTime,
    }))
  },
})

/** Confirm/unconfirm a contribution (toggles whether it counts toward totals). */
export const setContributionPending = mutation({
  args: {
    secret: v.string(),
    id: v.id('contributions'),
    pending: v.boolean(),
  },
  handler: async (ctx, { secret, id, pending }) => {
    assertSecret(secret)
    await ctx.db.patch(id, { pending })
    return { ok: true }
  },
})

export const deleteContribution = mutation({
  args: { secret: v.string(), id: v.id('contributions') },
  handler: async (ctx, { secret, id }) => {
    assertSecret(secret)
    await ctx.db.delete(id)
    return { ok: true }
  },
})
