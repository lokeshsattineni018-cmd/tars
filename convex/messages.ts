import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

export const generateUploadUrl = mutation(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
});

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.optional(v.string()),
        type: v.string(), // "text", "image", "audio"
        imageId: v.optional(v.id("_storage")),
        audioId: v.optional(v.id("_storage")),
        replyToId: v.optional(v.id("messages")),
        isForwarded: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user._id,
            content: args.content || "",
            type: args.type,
            imageId: args.imageId,
            audioId: args.audioId,
            replyToId: args.replyToId,
            isDeleted: false,
            isPinned: false,
            isForwarded: args.isForwarded,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
        });

        // Trigger link preview parsing if there's a URL
        if (args.type === "text" && args.content) {
            const urlMatch = args.content.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                await ctx.scheduler.runAfter(0, internal.links.parseLink, {
                    messageId,
                    url: urlMatch[1],
                });
            }
        }

        return messageId;
    },
});

export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const messages = await ctx.db
            .query("messages")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        const messagesWithExtras = [];
        for (const msg of messages) {
            if (msg.deletedBy?.includes(user._id)) continue;

            const sender = await ctx.db.get(msg.senderId);
            const reactions = await ctx.db
                .query("reactions")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withIndex("by_messageId", (q: any) => q.eq("messageId", msg._id))
                .collect();

            // Group reactions by emoji: { '👍': ['userId1', 'userId2'] }
            const groupedReactions: Record<string, string[]> = {};
            for (const r of reactions) {
                if (!groupedReactions[r.emoji]) {
                    groupedReactions[r.emoji] = [];
                }
                groupedReactions[r.emoji].push(r.userId as string);
            }

            // Convert to array format to bypass Convex JSON key ASCII validation
            const safeReactionsArray = Object.entries(groupedReactions).map(([emoji, users]) => ({
                emoji,
                users,
            }));

            // Get the image URL if there's an attachment
            const imageUrl = msg.imageId ? await ctx.storage.getUrl(msg.imageId) : null;

            // Get the audio URL if it's a voice memo
            const audioUrl = msg.audioId ? await ctx.storage.getUrl(msg.audioId) : null;

            // Get the original message if it's a quote reply
            let replyMessage = null;
            if (msg.replyToId) {
                const original = await ctx.db.get(msg.replyToId);
                if (original && !original.isDeleted && !original.deletedBy?.includes(user._id)) {
                    const replySender = await ctx.db.get(original.senderId);
                    replyMessage = { ...original, sender: replySender };
                }
            }

            messagesWithExtras.push({
                ...msg,
                sender,
                reactions: safeReactionsArray,
                imageUrl,
                audioUrl,
                replyMessage,
            });
        }

        return messagesWithExtras;
    },
});

export const getPinnedMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .filter((q: any) => q.eq(q.field("isPinned"), true))
            .collect();

        const messagesWithExtras = [];
        for (const msg of messages) {
            if (msg.deletedBy?.includes(user._id)) continue;

            const sender = await ctx.db.get(msg.senderId);
            messagesWithExtras.push({ ...msg, sender });
        }

        return messagesWithExtras;
    },
});

export const getMessagesPaginated = query({
    args: {
        conversationId: v.id("conversations"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return {
                page: [],
                isDone: true,
                continueCursor: "",
            };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return {
                page: [],
                isDone: true,
                continueCursor: "",
            };
        }

        const results = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .paginate(args.paginationOpts);

        const messagesWithExtras = [];
        for (const msg of results.page) {
            if (msg.deletedBy?.includes(user._id)) continue;

            const sender = await ctx.db.get(msg.senderId);
            const reactions = await ctx.db.query("reactions").withIndex("by_messageId", (q: any) => q.eq("messageId", msg._id)).collect();

            const groupedReactions: Record<string, string[]> = {};
            for (const r of reactions) {
                if (!groupedReactions[r.emoji]) groupedReactions[r.emoji] = [];
                groupedReactions[r.emoji].push(r.userId as string);
            }

            const safeReactionsArray = Object.entries(groupedReactions).map(([emoji, users]) => ({ emoji, users }));
            const imageUrl = msg.imageId ? await ctx.storage.getUrl(msg.imageId) : null;
            const audioUrl = msg.audioId ? await ctx.storage.getUrl(msg.audioId) : null;

            let replyMessage = null;
            if (msg.replyToId) {
                const original = await ctx.db.get(msg.replyToId);
                if (original && !original.isDeleted && !original.deletedBy?.includes(user._id)) {
                    const replySender = await ctx.db.get(original.senderId);
                    replyMessage = { ...original, sender: replySender };
                }
            }

            messagesWithExtras.push({ ...msg, sender, reactions: safeReactionsArray, imageUrl, audioUrl, replyMessage });
        }

        return { ...results, page: messagesWithExtras };
    },
});

export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
        type: v.union(v.literal("everyone"), v.literal("me"))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        if (args.type === "everyone") {
            if (message.senderId !== user._id) {
                throw new Error("You can only delete your own messages");
            }
            await ctx.db.patch(args.messageId, {
                isDeleted: true,
                content: "This message was deleted",
            });
        } else {
            const deletedBy = message.deletedBy || [];
            if (!deletedBy.includes(user._id)) {
                await ctx.db.patch(args.messageId, {
                    deletedBy: [...deletedBy, user._id],
                });
            }
        }
    },
});

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const existing = await ctx.db
            .query("reactions")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .withIndex("by_messageId_and_userId_and_emoji", (q: any) =>
                q.eq("messageId", args.messageId).eq("userId", user._id).eq("emoji", args.emoji)
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: user._id,
                emoji: args.emoji,
            });
        }
    },
});

export const toggleStar = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!user) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) return;

        const currentStars = message.starredBy || [];
        const isStarred = currentStars.includes(user._id);

        await ctx.db.patch(args.messageId, {
            starredBy: isStarred
                ? currentStars.filter(id => id !== user._id)
                : [...currentStars, user._id]
        });
    }
});

export const togglePin = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const message = await ctx.db.get(args.messageId);
        if (!message) return;

        await ctx.db.patch(args.messageId, {
            isPinned: !message.isPinned
        });
    }
});

export const updateLinkMetadata = internalMutation({
    args: {
        messageId: v.id("messages"),
        metadata: v.object({
            title: v.string(),
            description: v.optional(v.string()),
            image: v.optional(v.string()),
            url: v.string(),
        })
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            linkMetadata: args.metadata
        });
    }
});

export const editMessage = mutation({
    args: {
        messageId: v.id("messages"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        if (message.senderId !== user._id) {
            throw new Error("You can only edit your own messages");
        }

        if (message.type !== "text") {
            throw new Error("Only text messages can be edited");
        }

        const now = Date.now();
        // 5 minutes in milliseconds
        if (now - message._creationTime > 5 * 60 * 1000) {
            throw new Error("Messages can only be edited within 5 minutes of sending");
        }

        await ctx.db.patch(args.messageId, {
            content: args.content,
            isEdited: true,
            // We might also want to re-parse links if we edit, but for simplicity we can let the frontend handle it or clear it.
            // Let's clear previous link metadata if the content changes to avoid stale previews
            linkMetadata: undefined,
        });
    }
});
