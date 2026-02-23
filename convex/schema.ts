import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.optional(v.number()),
    theme: v.optional(v.string()), // Kept for legacy compatibility
    layoutMode: v.optional(v.string()), // Kept for legacy compatibility
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    name: v.optional(v.string()), // For group chats
    isGroup: v.boolean(),
    lastMessageId: v.optional(v.id("messages")),
    theme: v.optional(v.string()),
  }),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadMessageId: v.optional(v.id("messages")),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_userId", ["userId"])
    .index("by_conversationId_and_userId", ["conversationId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.string(), // "text", "image", "audio", etc.
    imageId: v.optional(v.id("_storage")),
    audioId: v.optional(v.id("_storage")), // For voice messages
    isDeleted: v.boolean(),
    deletedBy: v.optional(v.array(v.id("users"))),
    replyToId: v.optional(v.id("messages")), // For quoted replies
    isPinned: v.optional(v.boolean()),
    starredBy: v.optional(v.array(v.id("users"))),
    isForwarded: v.optional(v.boolean()),
    isEdited: v.optional(v.boolean()),
    linkMetadata: v.optional(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
        url: v.string(),
      })
    ),
  }).index("by_conversationId", ["conversationId"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_messageId_and_userId_and_emoji", ["messageId", "userId", "emoji"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expiresAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),
});
