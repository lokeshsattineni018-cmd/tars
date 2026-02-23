import { query } from "./_generated/server";
export const test = query({ handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return { identity, users: await ctx.db.query("users").collect() };
}});
