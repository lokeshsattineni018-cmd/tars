import { mutation } from "./_generated/server";
export const test = mutation({ handler: async (ctx) => {
    return await ctx.db.query("users").collect();
}});
