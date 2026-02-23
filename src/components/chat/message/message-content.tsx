"use client";

import { Forward, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Message } from "@/types";

interface MessageContentProps {
    message: any;
    isMe: boolean;
    onScrollToReply: (replyToId: string) => void;
}

export function MessageContent({ message, isMe, onScrollToReply }: MessageContentProps) {
    if (message.isDeleted) {
        return <span className="italic opacity-60">This message was deleted</span>;
    }

    return (
        <>
            {message.replyMessage && (
                <div
                    onClick={() => onScrollToReply(message.replyToId)}
                    className="bg-black/10 dark:bg-white/10 rounded-lg p-2 mb-1.5 text-xs border-l-2 border-zinc-400 dark:border-zinc-500 shadow-sm overflow-hidden mt-0.5 mx-0.5 cursor-pointer hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {message.replyMessage.sender?.name || "Unknown"}
                    </div>
                    <div className="truncate opacity-80 max-w-[200px]">
                        {message.replyMessage.content || "Attachment"}
                    </div>
                </div>
            )}

            {message.isForwarded && (
                <div className={cn(
                    "flex items-center gap-1 text-[10px] mb-1 italic opacity-70",
                    isMe ? "text-white/80" : "text-zinc-600 dark:text-zinc-400"
                )}>
                    <Forward className="h-3 w-3" />
                    Forwarded
                </div>
            )}

            {message.type === "image" && message.imageUrl ? (
                <Dialog>
                    <DialogTrigger asChild>
                        <img
                            src={message.imageUrl}
                            alt="Attachment"
                            className="max-w-[250px] max-h-[350px] object-cover sm:max-w-[300px] cursor-pointer hover:opacity-90 transition rounded-lg"
                            loading="lazy"
                            decoding="async"
                        />
                    </DialogTrigger>
                    <DialogContent showCloseButton={false} className="max-w-4xl p-0 bg-transparent border-none shadow-none flex items-center justify-center">
                        <DialogTitle className="sr-only">Image Preview</DialogTitle>
                        <div className="relative group">
                            <img
                                src={message.imageUrl}
                                alt="Attachment fullscreen"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                loading="eager"
                                decoding="async"
                            />
                            <DialogClose className="absolute top-3 right-3 sm:-top-12 sm:right-0 p-2.5 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full transition-all z-50 shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            ) : message.type === "audio" && message.audioUrl ? (
                <div className="flex flex-col gap-1 p-1">
                    <audio
                        controls
                        src={message.audioUrl}
                        className={cn(
                            "h-10 w-[200px] sm:w-[240px]",
                            isMe && "opacity-90 brightness-110"
                        )}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-1.5">
                    <span className="whitespace-pre-wrap">{message.content}</span>
                    {message.linkMetadata && (
                        <a
                            href={message.linkMetadata.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "block mt-1 rounded-lg overflow-hidden border transition hover:opacity-95",
                                isMe ? "bg-black/10 border-white/20" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                            )}
                        >
                            {message.linkMetadata.image && (
                                <div className="w-full h-28 relative bg-zinc-200 dark:bg-zinc-800">
                                    <img
                                        src={message.linkMetadata.image}
                                        alt={message.linkMetadata.title || "Link preview"}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            <div className="p-2.5 text-sm flex flex-col gap-0.5">
                                <span className="font-semibold line-clamp-1">{message.linkMetadata.title || message.linkMetadata.url}</span>
                                {message.linkMetadata.description && (
                                    <span className="text-xs opacity-80 line-clamp-2">{message.linkMetadata.description}</span>
                                )}
                                <span className="text-[10px] opacity-60 line-clamp-1 mt-0.5">
                                    {URL.canParse?.(message.linkMetadata.url) ? new URL(message.linkMetadata.url).hostname : message.linkMetadata.url}
                                </span>
                            </div>
                        </a>
                    )}
                </div>
            )}
        </>
    );
}
