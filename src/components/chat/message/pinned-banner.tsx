"use client";

import { Pin } from "lucide-react";

interface PinnedBannerProps {
    pinnedMessages: any[];
}

export function PinnedBanner({ pinnedMessages }: PinnedBannerProps) {
    if (!pinnedMessages || pinnedMessages.length === 0) return null;

    return (
        <div className="absolute top-0 left-0 right-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 p-2 text-sm flex items-center shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden w-full max-w-3xl mx-auto px-4">
                <Pin className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="truncate flex flex-col">
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-blue-500">Pinned Message</span>
                    <span className="text-zinc-600 dark:text-zinc-300 truncate text-xs">
                        {pinnedMessages[pinnedMessages.length - 1].content || "Attachment"}
                    </span>
                </div>
            </div>
        </div>
    );
}
