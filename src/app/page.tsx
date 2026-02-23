"use client";

import { usePresence } from "@/hooks/use-presence";
import { Suspense } from "react";
import { AppLayout } from "@/components/chat/app-layout";

function ChatApp() {
  usePresence();
  return <AppLayout />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ChatApp />
    </Suspense>
  );
}
