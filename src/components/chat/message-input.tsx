"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizonal, ImagePlus, Smile, X, Mic, Square, Trash, Pencil } from "lucide-react";
import { useTypingIndicator } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";
import EmojiPicker from "emoji-picker-react";

export function MessageInput({
    conversationId,
    replyingTo,
    onCancelReply,
    editingMessage,
    onCancelEdit
}: {
    conversationId: Id<"conversations">;
    replyingTo?: { id: Id<"messages">, content: string, senderName: string } | null;
    onCancelReply?: () => void;
    editingMessage?: { id: Id<"messages">, content: string } | null;
    onCancelEdit?: () => void;
}) {
    const [content, setContent] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const sendMessage = useMutation(api.messages.send);
    const editMessage = useMutation(api.messages.editMessage);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const { setIsTyping } = useTypingIndicator(conversationId);

    useEffect(() => {
        if (editingMessage) {
            setContent(editingMessage.content);
        } else if (!editingMessage) {
            // We only want to clear the content if the content currently matches the old string
            // However since editingMessage is null here we can just clear it if we cancelled.
            setContent((prev) => prev); // Wait, actually we just need to reset the state when editing cancels
            // But we don't want to wipe out text they typed before hitting edit.
            // Let's just clear for now if editingMessage turns to null but we can let them keep it if they manually clear it.
            // To simplify, we'll let X button handle clearing.
        }
    }, [editingMessage]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        setRecordingTime(0);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const sendAudioMessage = async () => {
        if (!audioBlob) return;
        try {
            setIsUploading(true);
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": audioBlob.type },
                body: audioBlob,
            });
            const { storageId } = await result.json();

            await sendMessage({
                conversationId,
                type: "audio",
                audioId: storageId,
                replyToId: replyingTo?.id,
            });
            setAudioBlob(null);
            setRecordingTime(0);
            if (onCancelReply) onCancelReply();
        } catch (error) {
            console.error("Failed to upload audio:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageContent = content.trim();
        if (!messageContent) return;

        setSendError(null);
        setContent(""); // Clear immediately for instant feedback
        setIsTyping(false);
        setShowEmoji(false);

        try {
            if (editingMessage) {
                await editMessage({
                    messageId: editingMessage.id,
                    content: messageContent,
                });
                if (onCancelEdit) onCancelEdit();
            } else {
                await sendMessage({
                    conversationId,
                    content: messageContent,
                    type: "text",
                    replyToId: replyingTo?.id,
                });
                if (onCancelReply) onCancelReply();
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            // Restore content if it fails so the user doesn't lose their message
            setContent(messageContent);
            setSendError(messageContent);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            await sendMessage({
                conversationId,
                type: "image",
                imageId: storageId,
                replyToId: replyingTo?.id,
            });

            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
            if (onCancelReply) onCancelReply();
        } catch (error) {
            console.error("Failed to upload image:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-3 relative flex flex-col gap-2 transition-colors duration-300 w-full bg-white/70 dark:bg-black/40 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800/60">
            {sendError && (
                <div className="flex items-center justify-between text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50">
                    <span>Message failed to send.</span>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setSendError(null)} className="hover:underline transition-colors">Dismiss</button>
                        <button type="button" onClick={() => { setContent(sendError); setSendError(null); }} className="font-semibold hover:underline transition-colors">Retry</button>
                    </div>
                </div>
            )}
            {showEmoji && (
                <div className="absolute bottom-20 left-4 z-50">
                    <EmojiPicker
                        onEmojiClick={(emojiData) => {
                            setContent((prev) => prev + emojiData.emoji);
                        }}
                        lazyLoadEmojis
                        skinTonesDisabled
                    />
                </div>
            )}
            {replyingTo && !editingMessage && (
                <div className="flex items-center justify-between text-sm bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col overflow-hidden whitespace-nowrap">
                        <span className="font-semibold text-blue-500">Replying to {replyingTo.senderName}</span>
                        <span className="truncate opacity-80 text-xs">{replyingTo.content || "Image"}</span>
                    </div>
                    <button type="button" onClick={onCancelReply} className="h-6 w-6 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
            {editingMessage && (
                <div className="flex items-center justify-between text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/50">
                    <div className="flex flex-col overflow-hidden whitespace-nowrap">
                        <span className="font-semibold flex items-center gap-1.5"><Pencil className="h-3 w-3" /> Editing message</span>
                        <span className="truncate opacity-80 text-xs">{editingMessage.content}</span>
                    </div>
                    <button type="button" onClick={() => {
                        setContent("");
                        if (onCancelEdit) onCancelEdit();
                    }} className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800/50 hover:bg-blue-300 dark:hover:bg-blue-700/50 transition">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 transition-all w-full bg-zinc-100/80 dark:bg-zinc-900/80 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800 focus-within:ring-blue-500 backdrop-blur-sm shadow-sm"
            >
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-zinc-500 hover:text-blue-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <ImagePlus className={cn("h-5 w-5", isUploading && "animate-pulse")} />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-zinc-500 hover:text-blue-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full"
                    onClick={() => setShowEmoji(!showEmoji)}
                    disabled={isRecording || !!audioBlob}
                >
                    <Smile className="h-5 w-5" />
                </Button>

                {isRecording || audioBlob ? (
                    <div className="flex-1 flex items-center justify-between mx-2 pl-2">
                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition" onClick={cancelRecording}>
                                <Trash className="h-4 w-4" />
                            </Button>
                            {isRecording ? (
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition" onClick={stopRecording}>
                                    <Square className="h-4 w-4 fill-current" />
                                </Button>
                            ) : (
                                <Button type="button" size="icon" className="h-8 w-8 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition active:scale-95" onClick={sendAudioMessage} disabled={isUploading}>
                                    <SendHorizonal className="h-4 w-4 ml-0.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center">
                        <input
                            type="text"
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                setIsTyping(true);
                            }}
                            placeholder="Message me..."
                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 placeholder:text-zinc-400"
                            disabled={isUploading}
                        />
                    </div>
                )}

                {!isRecording && !audioBlob && (
                    <Button
                        type={content.trim() ? "submit" : "button"}
                        size="icon"
                        onClick={content.trim() ? undefined : startRecording}
                        className={cn(
                            "shrink-0 h-8 w-8 rounded-full transition-transform active:scale-95 ml-1 flex-shrink-0",
                            content.trim()
                                ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-blue-500 hover:bg-zinc-300"
                        )}
                        disabled={isUploading}
                    >
                        {content.trim() ? <SendHorizonal className="h-4 w-4 ml-0.5" /> : <Mic className="h-4 w-4" />}
                    </Button>
                )}
            </form>
        </div>
    );
}
