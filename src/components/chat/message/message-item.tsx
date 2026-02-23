"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatMessageTime } from "@/lib/utils";
import { Pin, Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { MessageActions } from "./message-actions";
import { MessageContent } from "./message-content";
import { Id } from "../../../../convex/_generated/dataModel";
import { Check } from "lucide-react";

interface MessageItemProps {
    message: any;
    isMe: boolean;
    isSelectMode: boolean;
    isSelected: boolean;
    onSelect: (id: Id<"messages">) => void;
    currentUserId: string | null | undefined;
    meId?: Id<"users">;
    otherMemberReadId?: string | null;
    onReply: (msg: { id: Id<"messages">, content: string, senderName: string }) => void;
    onEdit?: (msg: { id: Id<"messages">, content: string }) => void;
    onDelete: (id: Id<"messages">, type: "everyone" | "me") => void;
    onReaction: (id: Id<"messages">, emoji: string) => void;
    onStar: (id: Id<"messages">) => void;
    onPin: (id: Id<"messages">) => void;
    onCopy: (text: string) => void;
    onForward: (msg: any) => void;
    onScrollToReply: (replyToId: string) => void;
    setIsSelectMode: (val: boolean) => void;
}

export function MessageItem({
    message,
    isMe,
    isSelectMode,
    isSelected,
    onSelect,
    currentUserId,
    meId,
    otherMemberReadId,
    onReply,
    onEdit,
    onDelete,
    onReaction,
    onStar,
    onPin,
    onCopy,
    onForward,
    onScrollToReply,
    setIsSelectMode
}: MessageItemProps) {
    const sender = message.sender;
    const isEditable = message.type === "text" && Date.now() - message._creationTime <= 5 * 60 * 1000;

    return (
        <div
            onClick={() => {
                if (isSelectMode) onSelect(message._id);
            }}
            className={cn(
                "flex items-center gap-3 group w-full px-4",
                isSelectMode ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900/50 p-2 rounded-xl transition -mx-2" : "",
                isSelected && "bg-blue-50/50 dark:bg-blue-900/40"
            )}
        >
            {isSelectMode && (
                <div className="flex-shrink-0 ml-1 sm:ml-2">
                    <div className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                        isSelected ? "bg-blue-500 border-blue-500" : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                    )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                </div>
            )}

            <div className={cn(
                "flex items-end gap-2 flex-1 min-w-0",
                isMe ? "flex-row-reverse" : "flex-row"
            )}>
                {!isMe && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.imageUrl} />
                        <AvatarFallback>{sender?.name?.[0]}</AvatarFallback>
                    </Avatar>
                )}
                <div className={cn(
                    "flex flex-col max-w-[70%] sm:max-w-[80%]",
                    isMe ? "items-end" : "items-start"
                )}>
                    {!isMe && (
                        <span className="text-[10px] text-zinc-500 mb-1 ml-1 self-start">
                            {sender?.name}
                        </span>
                    )}
                    <motion.div
                        id={`msg-${message._id}`}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.15}
                        onDragEnd={(_e, info) => {
                            if (Math.abs(info.offset.x) > 60 && !message.isDeleted) {
                                onReply({ id: message._id, content: message.content, senderName: sender?.name || "Unknown" });
                            }
                        }}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                        className="relative group/content flex items-center gap-2 outline-none focus:outline-none select-none"
                    >
                        {isMe && !message.isDeleted && (
                            <MessageActions
                                onDelete={(type) => onDelete(message._id, type)}
                                onReact={(emoji) => onReaction(message._id, emoji)}
                                onStar={() => onStar(message._id)}
                                onPin={() => onPin(message._id)}
                                onCopy={() => onCopy(message.content)}
                                onReply={() => onReply({ id: message._id, content: message.content, senderName: sender?.name || "Unknown" })}
                                onEdit={
                                    (isEditable && onEdit)
                                        ? () => onEdit({ id: message._id, content: message.content })
                                        : undefined
                                }
                                onForward={() => onForward(message)}
                                onSelectMode={() => setIsSelectMode(true)}
                                isMe={isMe}
                                isStarred={meId ? message.starredBy?.includes(meId) : false}
                                isPinned={message.isPinned}
                            />
                        )}
                        <div
                            data-is-me={isMe}
                            className={cn(
                                "relative max-w-full text-[15px] break-words shadow-sm leading-relaxed transition-all duration-300 message-bubble",
                                "rounded-[22px]",
                                isMe
                                    ? "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-br-sm"
                                    : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 rounded-bl-sm",
                                message.type === "text" && "px-4 py-2.5",
                                message.type === "image" && "p-0 overflow-hidden",
                                message.isDeleted && "italic opacity-60 bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-500 shadow-none px-4 py-2.5"
                            )}
                        >
                            <MessageContent
                                message={message}
                                isMe={isMe}
                                onScrollToReply={onScrollToReply}
                            />
                        </div>
                        {!isMe && !message.isDeleted && (
                            <MessageActions
                                onDelete={(type) => onDelete(message._id, type)}
                                onReact={(emoji) => onReaction(message._id, emoji)}
                                onStar={() => onStar(message._id)}
                                onPin={() => onPin(message._id)}
                                onCopy={() => onCopy(message.content)}
                                onReply={() => onReply({ id: message._id, content: message.content, senderName: sender?.name || "Unknown" })}
                                onForward={() => onForward(message)}
                                onSelectMode={() => setIsSelectMode(true)}
                                isMe={isMe}
                                isStarred={meId ? message.starredBy?.includes(meId) : false}
                                isPinned={message.isPinned}
                            />
                        )}
                    </motion.div>

                    {message.reactions && message.reactions.length > 0 && (
                        <div className={cn(
                            "flex flex-wrap gap-1 mt-1",
                            isMe ? "justify-end" : "justify-start"
                        )}>
                            {message.reactions.map(({ emoji, users }: { emoji: string, users: string[] }) => {
                                const safeUsers = Array.isArray(users) ? users : [];
                                return (
                                    <button
                                        key={emoji}
                                        onClick={(e) => { e.stopPropagation(); onReaction(message._id, emoji); }}
                                        className={cn(
                                            "flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-0.5 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition",
                                            safeUsers.includes(currentUserId || "") && "bg-blue-100 dark:bg-blue-900 border-blue-200"
                                        )}
                                    >
                                        <span>{emoji}</span>
                                        <span>{safeUsers.length}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className={cn(
                        "flex items-center gap-1 mt-1 px-1 text-[10px] text-zinc-400",
                        isMe ? "justify-end" : "justify-start"
                    )}>
                        {message.isPinned && <Pin className="h-3 w-3 fill-current" />}
                        {meId && message.starredBy?.includes(meId) && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        <span>{formatMessageTime(message._creationTime)}</span>
                        {message.isEdited && <span className="italic ml-1">(edited)</span>}
                    </div>

                    {isMe && !message.isDeleted && otherMemberReadId === message._id && (
                        <div className="text-[10px] text-zinc-400 mt-1 mr-1 flex items-center justify-end gap-1 animate-in fade-in">
                            <CheckCircle2 className="h-3 w-3 outline-none text-blue-500" />
                            Seen
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
