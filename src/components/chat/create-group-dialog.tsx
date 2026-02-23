"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Check } from "lucide-react";

export function CreateGroupDialog({ onGroupCreated }: { onGroupCreated: (id: string) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const users = useQuery(api.users.getUsers);
    const createGroup = useMutation(api.conversations.createGroup);

    const filteredUsers = users?.filter(
        (user) => user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggleUser = (userId: Id<"users">) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || selectedUsers.length < 2) return;
        setIsCreating(true);

        try {
            const groupId = await createGroup({
                name: name.trim(),
                participantIds: selectedUsers
            });
            setOpen(false);
            setName("");
            setSelectedUsers([]);
            onGroupCreated(groupId);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
                    <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                    <Input
                        placeholder="Group Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-xl"
                        maxLength={30}
                    />

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-500">Add Members</span>
                            {selectedUsers.length > 0 && (
                                <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                    {selectedUsers.length} selected
                                </span>
                            )}
                        </div>
                        <Input
                            placeholder="Search friends..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl"
                        />
                    </div>

                    <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                        <div className="flex flex-col gap-1">
                            {filteredUsers?.map((user) => {
                                const isSelected = selectedUsers.includes(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        onClick={() => toggleUser(user._id)}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                                    >
                                        <div className="relative">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.imageUrl} />
                                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            {isSelected && (
                                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white dark:border-zinc-950">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium flex-1 truncate">{user.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>

                    <Button
                        type="submit"
                        disabled={!name.trim() || selectedUsers.length < 2 || isCreating}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-[0.98]"
                    >
                        {isCreating ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </div>
                        ) : (
                            "Create Group"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
