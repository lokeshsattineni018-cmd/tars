"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTypingIndicator } from "@/hooks/use-presence";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { ChevronLeft, Mail, Clock, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ChatHeader({ conversationId }: { conversationId: Id<"conversations"> }) {
    const conversations = useQuery(api.conversations.getConversations);
    const conversation = conversations?.find((c: any) => c._id === conversationId);
    const { typingUsers } = useTypingIndicator(conversationId);
    const me = useQuery(api.users.getMe);

    if (!conversation) return (
        <div className="p-4 border-b bg-white dark:bg-zinc-900 shadow-sm animate-pulse">
            <div className="h-10 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
    );

    const otherMember = conversation.otherMember;
    const isUserActive = otherMember?.lastSeen && Date.now() - otherMember.lastSeen < 60000;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 z-30 w-full flex-shrink-0 transition-colors duration-300 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-3 w-full">
                <Link href="/" className="md:hidden p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="relative group cursor-pointer transition transform hover:scale-105">
                            <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                                <AvatarImage src={otherMember?.imageUrl} />
                                <AvatarFallback>{otherMember?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            {isUserActive && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                            )}
                            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-center">
                                {conversation.isGroup ? "Group Info" : "Contact Info"}
                            </DialogTitle>
                        </DialogHeader>

                        {!conversation.isGroup && otherMember ? (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <Avatar className="h-24 w-24 border-2 border-zinc-100 dark:border-zinc-800">
                                    <AvatarImage src={otherMember.imageUrl} />
                                    <AvatarFallback className="text-3xl">{otherMember.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="text-center space-y-1">
                                    <h2 className="text-xl font-bold">{otherMember.name}</h2>
                                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                                        <Mail className="h-4 w-4" />
                                        <span>{otherMember.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-sm mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                        {isUserActive ? (
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium">
                                                <Circle className="h-3 w-3 fill-current" /> Active now
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Clock className="h-4 w-4" />
                                                Last seen {otherMember.lastSeen ? formatDistanceToNow(otherMember.lastSeen, { addSuffix: true }) : "Offline"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col py-4">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold">{conversation.name}</h2>
                                    <p className="text-sm text-zinc-500">{conversation.memberCount} members</p>
                                </div>
                                <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 mb-3 ml-2">Participants</h3>
                                <ScrollArea className="h-[200px]">
                                    <div className="space-y-1">
                                        {conversation.participants?.map((participant: any) => (
                                            <div key={participant._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={participant.imageUrl} />
                                                    <AvatarFallback>{participant.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{participant.name}</span>
                                                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">{participant.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-[15px] truncate cursor-pointer hover:underline" onClick={() => document.querySelector<HTMLDivElement>('.group.cursor-pointer')?.click()}>
                        {conversation.isGroup ? conversation.name : otherMember?.name}
                    </span>
                    <div className="h-4 flex items-center">
                        {typingUsers && typingUsers.length > 0 ? (
                            <span className="text-[11px] text-blue-500 font-medium animate-pulse">
                                {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
                            </span>
                        ) : (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {isUserActive
                                    ? "Active now"
                                    : otherMember?.lastSeen
                                        ? `Last seen ${formatDistanceToNow(otherMember.lastSeen, { addSuffix: true })}`
                                        : "Offline"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
