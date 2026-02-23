"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatMessageTime } from "@/lib/utils";

interface ForwardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messagesToForward: any[];
}

export function ForwardDialog({ open, onOpenChange, messagesToForward }: ForwardDialogProps) {
    const conversations = useQuery(api.conversations.getConversations);
    const sendMessage = useMutation(api.messages.send);
    const [search, setSearch] = useState("");
    const [sendingTo, setSendingTo] = useState<Set<Id<"conversations">>>(new Set());
    const [sentTo, setSentTo] = useState<Set<Id<"conversations">>>(new Set());

    const filteredConversations = conversations?.filter((conv: any) => {
        const name = conv.isGroup ? conv.name : conv.otherMember?.name;
        return name?.toLowerCase().includes(search.toLowerCase());
    });

    const handleForward = async (conversationId: Id<"conversations">) => {
        if (sendingTo.has(conversationId) || sentTo.has(conversationId)) return;

        setSendingTo(prev => new Set(prev).add(conversationId));

        try {
            for (const msg of messagesToForward) {
                await sendMessage({
                    conversationId,
                    content: msg.content,
                    type: msg.type,
                    imageId: msg.imageId,
                    audioId: msg.audioId,
                    isForwarded: true,
                });
            }
            setSentTo(prev => new Set(prev).add(conversationId));
        } catch (err) {
            console.error("Failed to forward:", err);
        } finally {
            setSendingTo(prev => {
                const newSet = new Set(prev);
                newSet.delete(conversationId);
                return newSet;
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) {
                setTimeout(() => setSentTo(new Set()), 300);
            }
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Forward Message{messagesToForward.length > 1 ? "s" : ""}</DialogTitle>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-9 bg-zinc-100 dark:bg-zinc-900 border-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                        {filteredConversations?.map((conv: any) => {
                            const isSending = sendingTo.has(conv._id);
                            const isSent = sentTo.has(conv._id);
                            const name = conv.isGroup ? conv.name : conv.otherMember?.name;
                            const image = conv.isGroup ? null : conv.otherMember?.imageUrl;

                            return (
                                <div key={conv._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={image} />
                                            <AvatarFallback>{name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{name}</span>
                                            {conv.isGroup && (
                                                <span className="text-xs text-zinc-500">{conv.memberCount} members</span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={isSent ? "secondary" : "default"}
                                        className="rounded-full w-20"
                                        disabled={isSending || isSent}
                                        onClick={() => handleForward(conv._id)}
                                    >
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSent ? "Sent" : "Send")}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                {messagesToForward.length > 0 && (
                    <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-1 font-medium tracking-wider uppercase">Preview</p>
                        <p className="text-sm line-clamp-2 truncate">{messagesToForward[0].content || "Attachment"}</p>
                        {messagesToForward.length > 1 && (
                            <p className="text-xs text-zinc-500 mt-1">+ {messagesToForward.length - 1} more messages</p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
