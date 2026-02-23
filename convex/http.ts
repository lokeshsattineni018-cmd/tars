import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook, WebhookRequiredHeaders } from "svix";

const http = httpRouter();

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx: any, request: any) => {
        const payloadString = await request.text();
        const headerPayload = request.headers;

        const svix_id = headerPayload.get("svix-id");
        const svix_timestamp = headerPayload.get("svix-timestamp");
        const svix_signature = headerPayload.get("svix-signature");

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response("Error occurred -- no svix headers", {
                status: 400,
            });
        }

        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            return new Response("Error occurred -- no webhook secret", {
                status: 400,
            });
        }

        const wh = new Webhook(webhookSecret);
        let evt: {
            type: "user.created" | "user.updated" | string;
            data: {
                id: string;
                email_addresses: Array<{ email_address: string }>;
                first_name: string;
                last_name: string;
                image_url: string;
            };
        };

        try {
            evt = wh.verify(payloadString, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            } as unknown as WebhookRequiredHeaders) as typeof evt;
        } catch (err) {
            console.error("Error verifying webhook:", err);
            return new Response("Error occurred", {
                status: 400,
            });
        }

        const eventType = evt.type;

        if (eventType === "user.created") {
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;
            const email = email_addresses[0]?.email_address;
            const name = `${first_name || ""} ${last_name || ""}`.trim();

            await ctx.runMutation(internal.users.createUser, {
                clerkId: id,
                email,
                name: name || email,
                imageUrl: image_url,
            });
        }

        if (eventType === "user.updated") {
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;
            const email = email_addresses[0]?.email_address;
            const name = `${first_name || ""} ${last_name || ""}`.trim();

            await ctx.runMutation(internal.users.updateUser, {
                clerkId: id,
                email,
                name: name || email,
                imageUrl: image_url,
            });
        }

        return new Response("", { status: 200 });
    }),
});

export default http;
