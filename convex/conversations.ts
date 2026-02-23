import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetConversation = mutation({
    args: {
        participantId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return null;

        // Check if conversation already exists
        const existingMember = await ctx.db
            .query("conversationMembers")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .withIndex("by_userId", (q: any) => q.eq("userId", currentUser._id))
            .collect();

        for (const member of existingMember) {
            const otherMember = await ctx.db
                .query("conversationMembers")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withIndex("by_conversationId_and_userId", (q: any) =>
                    q.eq("conversationId", member.conversationId).eq("userId", args.participantId)
                )
                .unique();

            if (otherMember) {
                // Also check if it's NOT a group chat
                const conv = await ctx.db.get(member.conversationId);
                if (conv && !conv.isGroup) {
                    return member.conversationId;
                }
            }
        }

        // Create new conversation
        const conversationId = await ctx.db.insert("conversations", {
            isGroup: false,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: currentUser._id,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: args.participantId,
        });

        return conversationId;
    },
});

export const createGroup = mutation({
    args: {
        name: v.string(),
        participantIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const conversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name,
        });

        const allMembers = [...args.participantIds, currentUser._id];

        for (const userId of allMembers) {
            await ctx.db.insert("conversationMembers", {
                conversationId,
                userId,
            });
        }

        return conversationId;
    },
});

export const getConversations = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const members = await ctx.db
            .query("conversationMembers")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
            .collect();

        const conversations = [];

        for (const member of members) {
            const conv = await ctx.db.get(member.conversationId);
            if (!conv) continue;

            // Get other participants
            const otherMembers = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conv._id))
                .collect();

            const otherMemberData = [];
            for (const m of otherMembers) {
                if (m.userId !== user._id) {
                    const u = await ctx.db.get(m.userId);
                    if (u) {
                        otherMemberData.push({
                            ...u,
                            lastReadMessageId: m.lastReadMessageId,
                        });
                    }
                }
            }

            // Get last message
            let lastMessage = null;
            if (conv.lastMessageId) {
                lastMessage = await ctx.db.get(conv.lastMessageId);
            }

            // Get unread count
            let lastReadMessageCreationTime = 0;
            if (member.lastReadMessageId) {
                const lastReadMessage = await ctx.db.get(member.lastReadMessageId);
                if (lastReadMessage) {
                    lastReadMessageCreationTime = lastReadMessage._creationTime;
                }
            }

            const unreadMessages = await ctx.db
                .query("messages")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conv._id))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((q: any) => q.gt(q.field("_creationTime"), lastReadMessageCreationTime))
                // Simplified unread logic: count messages created after lastReadMessageId's creation time
                // Actually, a better way is to store lastReadTimestamp
                .collect();

            // Filter out own messages from unread count
            const unreadCount = unreadMessages.filter((m: any) => m.senderId !== user._id).length;

            conversations.push({
                ...conv,
                otherMember: otherMemberData[0], // For direct messages
                participants: otherMemberData, // For groups and info dialogs
                memberCount: otherMembers.length,
                lastMessage,
                unreadCount,
            });
        }

        return conversations;
    },
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return;

        const member = await ctx.db
            .query("conversationMembers")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .withIndex("by_conversationId_and_userId", (q: any) =>
                q.eq("conversationId", args.conversationId).eq("userId", user._id)
            )
            .unique();

        const conversation = await ctx.db.get(args.conversationId);

        if (member && conversation && member.lastReadMessageId !== conversation.lastMessageId) {
            await ctx.db.patch(member._id, {
                lastReadMessageId: conversation.lastMessageId,
            });
        }
    },
});
export const setConversationTheme = mutation({
    args: {
        conversationId: v.id("conversations"),
        theme: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(args.conversationId, {
            theme: args.theme,
        });
    },
});
