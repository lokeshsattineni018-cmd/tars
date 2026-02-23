import { mutation } from "./_generated/server";
export const test = mutation({ handler: async (ctx) => {
    try {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { status: "failed", reason: "identity is null" };
        }
        return { status: "success", identity };
    } catch (e: any) {
        return { status: "error", error: e.message };
    }
}});
