import { mutation } from "./_generated/server";
export const test = mutation({ handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return "Not authenticated";
    }
    return "Authenticated!";
}});
