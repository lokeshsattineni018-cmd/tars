"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Id } from "../../../convex/_generated/dataModel";

export function UserSearch({ onSelect }: { onSelect: (userId: Id<"users">) => void }) {
    const [search, setSearch] = useState("");
    const users = useQuery(api.users.getUsers);
    const [open, setOpen] = useState(false);

    const filteredUsers = users?.filter((user: any) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                            {filteredUsers?.map((user: any) => (
                                <div
                                    key={user._id}
                                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                    onClick={() => {
                                        onSelect(user._id);
                                        setOpen(false);
                                    }}
                                >
                                    <Avatar>
                                        <AvatarImage src={user.imageUrl} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-medium truncate">{user.name}</span>
                                        <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                                    </div>
                                </div>
                            ))}
                            {filteredUsers?.length === 0 && (
                                <p className="text-center text-zinc-500 py-10">No users found</p>
                            )}
                            {users === undefined && (
                                <div className="space-y-2">
                                    <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                    <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
