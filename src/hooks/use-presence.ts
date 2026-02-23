"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function usePresence() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const updatePresence = useMutation(api.presence.updatePresence);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        const update = () => updatePresence({
            name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Unknown",
            email: user.primaryEmailAddress?.emailAddress || "",
            imageUrl: user.imageUrl || "",
        });
        update();
        const interval = setInterval(update, 10000);
        return () => clearInterval(interval);
    }, [updatePresence, isLoaded, isSignedIn, user]);
}

export function useTypingIndicator(conversationId: string) {
    const setTyping = useMutation(api.presence.setTyping);
    const typingUsers = useQuery(api.presence.getTypingIndicators, {
        conversationId: conversationId as Id<"conversations">
    });

    const setIsTyping = (isTyping: boolean) => {
        setTyping({
            conversationId: conversationId as Id<"conversations">,
            isTyping
        });
    };

    return { typingUsers: typingUsers || [], setIsTyping };
}
