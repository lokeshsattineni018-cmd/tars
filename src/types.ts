import { Id } from "../convex/_generated/dataModel";

export interface User {
    _id: Id<"users">;
    _creationTime: number;
    name: string;
    email: string;
    imageUrl: string;
    clerkId: string;
    isOnline: boolean;
    lastSeen?: number;
}

export interface Message {
    _id: Id<"messages">;
    _creationTime: number;
    conversationId: Id<"conversations">;
    senderId: Id<"users">;
    content: string;
    type: string;
    imageId?: Id<"_storage">;
    imageUrl?: string | null;
    audioId?: Id<"_storage">;
    audioUrl?: string | null;
    replyToId?: Id<"messages">;
    replyMessage?: any;
    isDeleted: boolean;
    deletedBy?: string[];
    isPinned?: boolean;
    starredBy?: string[];
    isForwarded?: boolean;
    sender?: User;
    reactions?: { emoji: string; users: string[] }[];
}

export interface Conversation {
    _id: string;
    _creationTime: number;
    name?: string;
    isGroup: boolean;
    lastMessageId?: string;
    otherMember?: User;
    lastMessage?: Message;
    unreadCount?: number;
    memberCount?: number;
}
