"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Sidebar } from "./sidebar";
import { ChatWindow } from "./chat-window";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export function AppLayout({ children }: { children?: React.ReactNode }) {
    const me = useQuery(api.users.getMe);
    const searchParams = useSearchParams();
    const conversationId = searchParams.get("id");

    if (me === undefined) {
        return <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-zinc-500 font-medium">Loading Tars Architecture...</p>
            </div>
        </div>;
    }

    // Default: Glassmorphism, floating elements, bouncy UI.
    return (
        <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-0 sm:p-4 md:p-8">
            <div className="flex flex-1 w-full max-w-[1400px] mx-auto overflow-hidden bg-white/70 dark:bg-black/60 backdrop-blur-3xl sm:rounded-3xl border border-white/20 shadow-2xl relative group/glass">
                <div className={cn(
                    "flex-shrink-0",
                    conversationId ? "hidden md:flex" : "flex w-full md:w-[350px]"
                )}>
                    <Sidebar />
                </div>
                <main className={cn(
                    "flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-black/20",
                    conversationId ? "flex w-full" : "hidden md:flex"
                )}>
                    <ChatWindow />
                </main>
            </div>
        </div>
    );
}
