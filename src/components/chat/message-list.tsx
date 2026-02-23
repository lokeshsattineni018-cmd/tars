"use client";

import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trash2, Forward, AlertTriangle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { ForwardDialog } from "./forward-dialog";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import { useTypingIndicator } from "@/hooks/use-presence";
import { PinnedBanner } from "./message/pinned-banner";
import { MessageItem } from "./message/message-item";

export function MessageList({
    conversationId,
    currentUserId,
    onReply,
    onEdit
}: {
    conversationId: string;
    currentUserId: string | null | undefined;
    onReply: (msg: { id: Id<"messages">, content: string, senderName: string }) => void;
    onEdit?: (msg: { id: Id<"messages">, content: string }) => void;
}) {
    const { results, status, loadMore } = usePaginatedQuery(
        api.messages.getMessagesPaginated,
        { conversationId: conversationId as Id<"conversations"> },
        { initialNumItems: 50 }
    );
    // Reverse because the query returns newest first, but visually we want oldest at the top
    const messages = useMemo(() => [...results].reverse(), [results]);

    const me = useQuery(api.users.getMe);
    const conversations = useQuery(api.conversations.getConversations);
    const conversation = conversations?.find((c: any) => c._id === conversationId);
    const otherMemberReadId = conversation && !conversation.isGroup ? conversation.otherMember?.lastReadMessageId : null;

    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.messages.toggleReaction);
    const toggleStar = useMutation(api.messages.toggleStar);
    const togglePin = useMutation(api.messages.togglePin);
    const markAsRead = useMutation(api.conversations.markAsRead);
    const pinnedMessages = useQuery(api.messages.getPinnedMessages, { conversationId: conversationId as Id<"conversations"> });
    const { typingUsers } = useTypingIndicator(conversationId as Id<"conversations">);
    const scrollRef = useRef<HTMLDivElement>(null);
    const observerTarget = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<Set<Id<"messages">>>(new Set());
    const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
    const [messagesToForward, setMessagesToForward] = useState<any[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && status === "CanLoadMore") {
                    loadMore(50);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [status, loadMore]);

    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const isNewArrival = lastMessage._id !== lastMessageIdRef.current;

            if (isNewArrival) {
                const isMe = lastMessage.sender?.clerkId === currentUserId;
                if (!isScrolledUp || isMe || lastMessageIdRef.current === null) {
                    scrollRef.current?.scrollIntoView({ behavior: lastMessageIdRef.current === null ? "auto" : "smooth" });
                }
                lastMessageIdRef.current = lastMessage._id;
            }
        }
    }, [messages, isScrolledUp, currentUserId]);

    useEffect(() => {
        if (messages && messages.length > 0) {
            markAsRead({ conversationId: conversationId as Id<"conversations"> });
        }
    }, [messages?.length, conversationId, markAsRead]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isUp = scrollHeight - scrollTop - clientHeight > 100;
        setIsScrolledUp(isUp);
    }, []);

    const handleScrollToReply = useCallback((replyToId: string) => {
        const container = document.getElementById(`msg-${replyToId}`);
        if (container) {
            container.scrollIntoView({ behavior: "smooth", block: "center" });
            const bubble = container.querySelector(".message-bubble");
            if (bubble) {
                bubble.classList.add("animate-apple-highlight");
                setTimeout(() => {
                    bubble.classList.remove("animate-apple-highlight");
                }, 1200);
            }
        }
    }, []);

    const onReaction = useCallback((messageId: Id<"messages">, emoji: string) => {
        toggleReaction({ messageId, emoji });
    }, [toggleReaction]);

    const onDelete = useCallback((messageId: Id<"messages">, type: "everyone" | "me") => {
        deleteMessage({ messageId, type });
    }, [deleteMessage]);

    const onBulkDelete = useCallback(async (type: "everyone" | "me") => {
        setIsDeletingBulk(true);
        try {
            const promises = Array.from(selectedMessageIds).map(messageId =>
                deleteMessage({ messageId, type })
            );
            await Promise.all(promises);
            setIsSelectMode(false);
            setSelectedMessageIds(new Set());
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete messages:", error);
        } finally {
            setIsDeletingBulk(false);
        }
    }, [selectedMessageIds, deleteMessage]);

    const onStar = useCallback((messageId: Id<"messages">) => toggleStar({ messageId }), [toggleStar]);
    const onPin = useCallback((messageId: Id<"messages">) => togglePin({ messageId }), [togglePin]);
    const onCopy = useCallback((text: string) => navigator.clipboard.writeText(text), []);

    if (status === "LoadingFirstPage") {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center opacity-50 relative">
                <PinnedBanner pinnedMessages={pinnedMessages || []} />
                <p className="text-zinc-500">No messages yet.</p>
                <p className="text-xs text-zinc-400">Send a message to start the conversation.</p>
            </div>
        );
    }

    return (
        <div className="relative flex-1 flex flex-col overflow-hidden transition-colors duration-500 bg-transparent">
            <PinnedBanner pinnedMessages={pinnedMessages || []} />
            <div className="flex-1 overflow-y-auto flex flex-col pt-14 pb-4" onScroll={handleScroll}>
                <div ref={observerTarget} className="h-1 w-full" />
                <div className={cn("text-center text-xs text-zinc-500 py-2 h-8 transition-opacity duration-300", status === "LoadingMore" ? "opacity-100" : "opacity-0 invisible")}>
                    Loading older messages...
                </div>
                <AnimatePresence initial={false}>
                    {messages.map((message: any, index: number) => {
                        const previousMessage = index > 0 ? messages[index - 1] : null;
                        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                        const isConsecutive = previousMessage &&
                            previousMessage.senderId === message.senderId &&
                            (message._creationTime - previousMessage._creationTime < 5 * 60 * 1000);

                        const isLastInGroup = !nextMessage ||
                            nextMessage.senderId !== message.senderId ||
                            (nextMessage._creationTime - message._creationTime >= 5 * 60 * 1000);

                        return (
                            <motion.div
                                key={message._id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    layout: { type: "spring", bounce: 0.3, duration: 0.4 },
                                    y: { type: "spring", bounce: 0.4, duration: 0.5 },
                                    scale: { duration: 0.2 }
                                }}
                                className={cn(isConsecutive ? "mt-1" : "mt-4")}
                            >
                                <MessageItem
                                    key={message._id}
                                    message={message}
                                    isMe={message.sender?.clerkId === currentUserId}
                                    isSelectMode={isSelectMode}
                                    isSelected={selectedMessageIds.has(message._id)}
                                    onSelect={(id) => {
                                        setSelectedMessageIds(prev => {
                                            const next = new Set(prev);
                                            if (next.has(id)) next.delete(id);
                                            else next.add(id);
                                            return next;
                                        });
                                    }}
                                    currentUserId={currentUserId}
                                    meId={me?._id}
                                    otherMemberReadId={otherMemberReadId}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onReaction={onReaction}
                                    onStar={onStar}
                                    onPin={onPin}
                                    onCopy={onCopy}
                                    onForward={(msg) => {
                                        setMessagesToForward([msg]);
                                        setForwardDialogOpen(true);
                                    }}
                                    onScrollToReply={handleScrollToReply}
                                    setIsSelectMode={setIsSelectMode}
                                    showName={!isConsecutive}
                                    showAvatar={isLastInGroup}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {typingUsers && typingUsers.length > 0 && (
                    <div className="flex items-end gap-2 group flex-row w-full animate-in fade-in slide-in-from-bottom-2 px-5">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-zinc-200 dark:bg-zinc-800">{typingUsers[0]?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="bg-zinc-200/80 dark:bg-zinc-800 rounded-[22px] rounded-bl-sm px-4 py-3 shadow-md flex items-center gap-1.5 w-16 h-[38px] border border-zinc-200/50 dark:border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] bg-blue-600"></span>
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] bg-blue-600"></span>
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-blue-600"></span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {isScrolledUp && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-300">
                    <Button
                        size="sm"
                        className="rounded-full shadow-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        onClick={() => {
                            setIsScrolledUp(false);
                            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                    >
                        ↓ New messages
                    </Button>
                </div>
            )}

            {isSelectMode && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-4 transition-all animate-in slide-in-from-bottom-5">
                    <span className="text-sm font-semibold">{selectedMessageIds.size} selected</span>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
                    <Button variant="ghost" size="sm" onClick={() => { setIsSelectMode(false); setSelectedMessageIds(new Set()); }}>Cancel</Button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={selectedMessageIds.size === 0}
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <Button size="sm" onClick={() => {
                            const selectedMsgs = messages.filter((m: any) => selectedMessageIds.has(m._id));
                            setMessagesToForward(selectedMsgs);
                            setForwardDialogOpen(true);
                            setIsSelectMode(false);
                            setSelectedMessageIds(new Set());
                        }} disabled={selectedMessageIds.size === 0}>
                            <Forward className="h-4 w-4 mr-2" />
                            Forward
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col gap-4 p-4 text-center">
                        <div className="mx-auto rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-2">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Delete {selectedMessageIds.size} messages?</DialogTitle>
                        <p className="text-sm text-zinc-500">
                            {Array.from(selectedMessageIds).every(id => {
                                const msg = messages.find((m: any) => m._id === id);
                                return msg?.sender?.clerkId === currentUserId;
                            })
                                ? "You can delete these messages for everyone, or just for yourself."
                                : "You can only delete these messages for yourself because they include messages from others."}
                        </p>
                        <div className="flex flex-col gap-2 mt-4">
                            {Array.from(selectedMessageIds).every(id => {
                                const msg = messages.find((m: any) => m._id === id);
                                return msg?.sender?.clerkId === currentUserId;
                            }) && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => onBulkDelete("everyone")}
                                        disabled={isDeletingBulk}
                                    >
                                        {isDeletingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete for everyone"}
                                    </Button>
                                )}
                            <Button
                                variant="outline"
                                className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 border-none"
                                onClick={() => onBulkDelete("me")}
                                disabled={isDeletingBulk}
                            >
                                {isDeletingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete for me"}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={isDeletingBulk}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ForwardDialog
                open={forwardDialogOpen}
                onOpenChange={setForwardDialogOpen}
                messagesToForward={messagesToForward}
            />
        </div>
    );
}
