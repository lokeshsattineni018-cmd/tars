"use client";

import { MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function ChatWindow() {
    const searchParams = useSearchParams();
    const conversationId = searchParams.get("id");
    const { userId } = useAuth();
    const markAsRead = useMutation(api.conversations.markAsRead);
    const [replyingTo, setReplyingTo] = useState<{ id: Id<"messages">, content: string, senderName: string } | null>(null);
    const [editingMessage, setEditingMessage] = useState<{ id: Id<"messages">, content: string } | null>(null);

    const me = useQuery(api.users.getMe);

    useEffect(() => {
        if (conversationId) {
            markAsRead({ conversationId: conversationId as Id<"conversations"> });
            setReplyingTo(null);
            setEditingMessage(null);
        }
    }, [conversationId, markAsRead]);

    if (!conversationId) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center transition-colors duration-300 bg-white/40 dark:bg-black/20 text-zinc-500">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 rounded-full bg-white dark:bg-zinc-800 shadow-sm">
                        <MessageSquare className="h-10 w-10 text-zinc-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Select a conversation</h2>
                        <p className="text-zinc-500">Pick someone from the sidebar to start chatting.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (me === undefined) {
        return <div className="flex-1 bg-transparent" />; // Wait for layout context to load smoothly
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300 bg-transparent">
            <ChatHeader conversationId={conversationId as Id<"conversations">} />
            <MessageList
                conversationId={conversationId}
                currentUserId={userId}
                onReply={(msg) => setReplyingTo(msg)}
                onEdit={(msg) => setEditingMessage(msg)}
            />
            <MessageInput
                conversationId={conversationId as Id<"conversations">}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                editingMessage={editingMessage}
                onCancelEdit={() => setEditingMessage(null)}
            />
        </div>
    );
}
