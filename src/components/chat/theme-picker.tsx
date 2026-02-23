"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";

const THEMES = [
    { name: "Classic Light", color: "bg-[#efeae2] border-[#e9edef]", value: "classic_light" },
    { name: "Classic Dark", color: "bg-[#0b141a] border-[#202c33]", value: "classic_dark" },
    { name: "Cyberpunk", color: "bg-gradient-to-tr from-pink-600 to-fuchsia-600", value: "cyberpunk" },
    { name: "Aurora", color: "bg-gradient-to-tr from-violet-600 to-indigo-600", value: "aurora" },
    { name: "Sunset", color: "bg-gradient-to-br from-orange-500 to-rose-500", value: "sunset" },
    { name: "Ocean", color: "bg-[#007EA7]", value: "ocean" },
];

export function ThemePicker({
    conversationId,
    currentTheme = "default"
}: {
    conversationId: Id<"conversations">;
    currentTheme?: string;
}) {
    const updateTheme = useMutation(api.conversations.setConversationTheme);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Palette className="h-5 w-5 text-zinc-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chat Wallpaper & Theme</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 py-4">
                    <button
                        onClick={() => updateTheme({ conversationId, theme: "default" })}
                        className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900",
                            currentTheme === "default"
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                : "border-transparent"
                        )}
                    >
                        <div className="h-12 w-12 rounded-full shadow-inner flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400">
                            {currentTheme === "default" && <Check className="h-6 w-6 text-blue-500" />}
                            {!currentTheme || currentTheme === "default" ? null : <Check className="h-6 w-6 opacity-0" />}
                        </div>
                        <span className="text-sm font-medium">Default</span>
                    </button>
                    {THEMES.map((theme) => (
                        <button
                            key={theme.value}
                            onClick={() => updateTheme({ conversationId, theme: theme.value })}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900",
                                currentTheme === theme.value
                                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                                    : "border-transparent"
                            )}
                        >
                            <div className={cn("h-12 w-12 rounded-full shadow-inner flex items-center justify-center", theme.color)}>
                                {currentTheme === theme.value && <Check className="h-6 w-6 text-white" />}
                            </div>
                            <span className="text-sm font-medium">{theme.name}</span>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
