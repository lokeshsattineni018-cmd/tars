import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const parseLink = internalAction({
    args: { messageId: v.id("messages"), url: v.string() },
    handler: async (ctx, args) => {
        try {
            // Basic URL validation
            new URL(args.url);

            const response = await fetch(args.url, {
                headers: {
                    'User-Agent': 'TarsBot/1.0 (LinkPreview)'
                },
                signal: AbortSignal.timeout(5000) // 5s timeout
            });

            if (!response.ok) return;

            const html = await response.text();

            // Simple regex parsing for OG tags since DOMParser isn't available in Node/V8 isolate
            const titleMatch = html.match(/<meta property="?og:title"? content="([^"]+)"?/i) || html.match(/<title>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta property="?og:description"? content="([^"]+)"?/i) || html.match(/<meta name="?description"? content="([^"]+)"?/i);
            const imgMatch = html.match(/<meta property="?og:image"? content="([^"]+)"?/i);

            if (titleMatch && titleMatch[1]) {
                const title = titleMatch[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
                const description = descMatch ? descMatch[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"') : undefined;

                await ctx.runMutation(internal.messages.updateLinkMetadata, {
                    messageId: args.messageId,
                    metadata: {
                        url: args.url,
                        title: title,
                        description: description,
                        image: imgMatch ? imgMatch[1] : undefined,
                    }
                });
            }
        } catch (e) {
            console.error("Failed to parse link metadata for", args.url, e);
        }
    }
});
