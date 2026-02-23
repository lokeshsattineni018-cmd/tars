"use client";

import { UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserSearch } from "./user-search";
import { CreateGroupDialog } from "./create-group-dialog";
import { ConversationItem } from "./conversation-item";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeConversationId = searchParams.get("id");
    const [search, setSearch] = useState("");

    const conversations = useQuery(api.conversations.getConversations);
    const createOrGetConversation = useMutation(api.conversations.createOrGetConversation);
    const me = useQuery(api.users.getMe);

    const prevConversationsRef = useRef<any[] | undefined>(undefined);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!conversations) return;

        const totalUnread = conversations.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);
        document.title = totalUnread > 0 ? `(${totalUnread}) Tars Chat` : "Tars Chat";

        const prev = prevConversationsRef.current;
        if (prev) {
            conversations.forEach((conv: any) => {
                const prevConv = prev.find((p: any) => p._id === conv._id);
                if (prevConv && conv.unreadCount > prevConv.unreadCount) {
                    if (Notification.permission === "granted" && document.hidden) {
                        const name = conv.isGroup ? conv.name : conv.otherMember?.name;
                        new Notification(`New message from ${name}`, {
                            body: conv.lastMessage?.type === 'text' ? conv.lastMessage.content : 'Sent an attachment',
                            icon: conv.otherMember?.imageUrl || "/favicon.ico"
                        });
                    }
                }
            });
        }
        prevConversationsRef.current = conversations;
    }, [conversations]);

    const handleSelectUser = async (userId: Id<"users">) => {
        const conversationId = await createOrGetConversation({ participantId: userId });
        router.push(`?id=${conversationId}`);
    };

    const filteredConversations = conversations?.filter((conv: any) => {
        const name = conv.isGroup ? conv.name : conv.otherMember?.name;
        return name?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="flex h-full w-full flex-col transition-all duration-300 relative border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
                    <div className="flex items-center gap-2">
                        <UserSearch onSelect={handleSelectUser} />
                        <CreateGroupDialog onGroupCreated={(id) => router.push(`?id=${id}`)} />
                        <UserButton afterSignOutUrl="/sign-in" />
                    </div>
                </div>
            </div>

            <div className="px-4 mb-2 mt-2">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Search..."
                        className="pl-10 h-10 border-transparent focus:border-transparent focus:ring-0 bg-zinc-100/80 dark:bg-zinc-900/80 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 mt-2">
                <div className="px-2 space-y-0.5">
                    {filteredConversations?.map((conv: any) => (
                        <div key={conv._id} className="transition-all">
                            <ConversationItem
                                conversation={conv}
                                isActive={activeConversationId === conv._id}
                                onClick={() => router.push(`?id=${conv._id}`)}
                            />
                        </div>
                    ))}
                    {conversations === undefined && (
                        <div className="space-y-2 p-2">
                            <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
                            <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
                            <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
                        </div>
                    )}
                    {conversations?.length === 0 && (
                        <div className="text-sm text-zinc-400 text-center py-10 mt-10">
                            No messages yet.<br />Start a new conversation.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
