import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updatePresence = mutation({
    args: {
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: true,
                lastSeen: Date.now(),
                name: args.name ?? identity.name ?? user.name,
                imageUrl: args.imageUrl ?? identity.pictureUrl ?? user.imageUrl,
            });
        } else {
            await ctx.db.insert("users", {
                clerkId: identity.subject,
                name: args.name ?? identity.name ?? identity.email ?? "Unknown",
                email: args.email ?? identity.email ?? "",
                imageUrl: args.imageUrl ?? identity.pictureUrl ?? "",
                isOnline: true,
                lastSeen: Date.now(),
            });
        }
    },
});

export const setOffline = mutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                isOnline: false,
                lastSeen: Date.now(),
            });
        }
    },
});

export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return;

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .filter((q: any) => q.eq(q.field("userId"), user._id))
            .unique();

        if (args.isTyping) {
            if (existing) {
                await ctx.db.patch(existing._id, { expiresAt: Date.now() + 3000 });
            } else {
                await ctx.db.insert("typingIndicators", {
                    conversationId: args.conversationId,
                    userId: user._id,
                    expiresAt: Date.now() + 3000,
                });
            }
        } else {
            if (existing) {
                await ctx.db.delete(existing._id);
            }
        }
    },
});

export const getTypingIndicators = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        let currentUser = null;
        if (identity) {
            currentUser = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
                .unique();
        }

        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        const result = [];
        const now = Date.now();

        for (const ind of indicators) {
            if (ind.expiresAt > now) {
                const user = await ctx.db.get(ind.userId);
                if (user && (!currentUser || user._id !== currentUser._id)) {
                    result.push(user.name);
                }
            }
        }

        return result;
    },
});
