const domain = process.env.CLERK_JWT_ISSUER_DOMAIN || "https://funny-marmot-4.clerk.accounts.dev";

const authConfig = {
    providers: [
        {
            domain: domain,
            applicationID: "convex",
        },
        {
            domain: domain.endsWith('/') ? domain.slice(0, -1) : `${domain}/`,
            applicationID: "convex",
        },
    ],
};

export default authConfig;
