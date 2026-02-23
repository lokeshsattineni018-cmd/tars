"use client";

import { MoreVertical, Trash2, Reply, Star, Pin, Forward, Copy, Pencil, CheckCircle2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
    onDelete?: (type: "everyone" | "me") => void;
    onReact: (emoji: string) => void;
    onReply?: () => void;
    onEdit?: () => void;
    onStar?: () => void;
    onPin?: () => void;
    onCopy?: () => void;
    onForward?: () => void;
    onSelectMode?: () => void;
    isMe: boolean;
    isStarred?: boolean;
    isPinned?: boolean;
}

export function MessageActions({
    onDelete,
    onReact,
    onReply,
    onStar,
    onPin,
    onCopy,
    onForward,
    onSelectMode,
    onEdit,
    isMe,
    isStarred,
    isPinned
}: MessageActionsProps) {
    return (
        <div className="opacity-0 group-hover/content:opacity-100 transition-opacity shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-600">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isMe ? "end" : "start"} className="w-56 bg-zinc-900 text-zinc-200 border-zinc-800 shadow-2xl rounded-xl p-1">
                    <div className="flex items-center justify-between p-2 pb-3 mb-1 border-b border-zinc-800">
                        {["👍", "❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => onReact(emoji)}
                                className="hover:scale-125 transition text-lg px-1"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <DropdownMenuItem onClick={onReply} className="focus:bg-zinc-800 focus:text-white cursor-pointer rounded-md my-0.5">
                        <Reply className="h-4 w-4 mr-3" />
                        Reply
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={onStar} className="focus:bg-zinc-800 focus:text-white cursor-pointer rounded-md my-0.5">
                        <Star className={cn("h-4 w-4 mr-3", isStarred && "fill-yellow-500 text-yellow-500")} />
                        {isStarred ? "Unstar" : "Star"}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={onPin} className="focus:bg-zinc-800 focus:text-white cursor-pointer rounded-md my-0.5">
                        <Pin className={cn("h-4 w-4 mr-3", isPinned && "fill-zinc-200")} />
                        {isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>

                    <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer rounded-md my-0.5" onClick={onForward}>
                        <Forward className="h-4 w-4 mr-3" />
                        Forward
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={onCopy} className="focus:bg-zinc-800 focus:text-white cursor-pointer rounded-md my-0.5">
                        <Copy className="h-4 w-4 mr-3" />
                        Copy
                    </DropdownMenuItem>

                    {onEdit && (
                        <DropdownMenuItem onClick={onEdit} className="focus:bg-zinc-800 focus:text-white cursor-pointer rounded-md my-0.5">
                            <Pencil className="h-4 w-4 mr-3" />
                            Edit
                        </DropdownMenuItem>
                    )}

                    <div className="h-px bg-zinc-800 my-1" />

                    {onDelete && (
                        <>
                            <DropdownMenuItem onClick={() => onDelete("me")} className="focus:bg-zinc-800 text-red-500 focus:text-red-500 cursor-pointer rounded-md my-0.5">
                                <Trash2 className="h-4 w-4 mr-3" />
                                Delete for me
                            </DropdownMenuItem>
                            {isMe && (
                                <DropdownMenuItem onClick={() => onDelete("everyone")} className="focus:bg-zinc-800 text-red-500 focus:text-red-500 cursor-pointer rounded-md my-0.5">
                                    <Trash2 className="h-4 w-4 mr-3" />
                                    Delete for everyone
                                </DropdownMenuItem>
                            )}
                        </>
                    )}

                    <div className="h-px bg-zinc-800 my-1" />

                    <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer rounded-md my-0.5" onClick={onSelectMode}>
                        <CheckCircle2 className="h-4 w-4 mr-3" />
                        Select messages
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
