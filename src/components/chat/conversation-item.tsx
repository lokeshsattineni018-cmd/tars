"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatMessageTime } from "@/lib/utils";
import { Conversation } from "@/types";

export function ConversationItem({
    conversation,
    isActive,
    onClick
}: {
    conversation: any;
    isActive: boolean;
    onClick: () => void;
}) {
    const otherMember = conversation.otherMember;
    const lastMessage = conversation.lastMessage;
    const unreadCount = conversation.unreadCount || 0;

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 cursor-pointer transition-all w-full rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:scale-[1.02] active:scale-[0.98]",
                isActive ? "bg-zinc-100 dark:bg-zinc-800" : ""
            )}
        >
            <div className="relative">
                <Avatar>
                    <AvatarImage src={otherMember?.imageUrl} />
                    <AvatarFallback>{otherMember?.name?.[0]}</AvatarFallback>
                </Avatar>
                {!conversation.isGroup && otherMember?.lastSeen && Date.now() - otherMember.lastSeen < 60000 && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <span className="font-semibold truncate text-sm flex-1">
                        {conversation.isGroup ? `${conversation.name} (${conversation.memberCount})` : otherMember?.name}
                    </span>
                    {lastMessage && (
                        <span className="text-[10px] text-zinc-500">
                            {formatMessageTime(lastMessage._creationTime)}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center gap-2">
                    <p className={cn(
                        "text-xs truncate",
                        unreadCount > 0 ? "text-zinc-900 dark:text-zinc-100 font-semibold" : "text-zinc-500",
                        lastMessage?.isDeleted && "italic opacity-70"
                    )}>
                        {lastMessage?.isDeleted ? "This message was deleted" :
                            lastMessage?.type === "image" ? "📷 Photo" :
                                lastMessage?.type === "audio" ? "🎤 Voice message" :
                                    (lastMessage?.content || "No messages yet")}
                    </p>
                    {unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
