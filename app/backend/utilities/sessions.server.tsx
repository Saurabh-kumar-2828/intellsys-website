import {createCookieSessionStorage} from "@remix-run/node";

const {getSession, commitSession, destroySession} = createCookieSessionStorage({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
        name: "__session",

        // domain: "lectrix.com",
        // all of these are optional
        // Expires can also be set (although maxAge overrides it when used in combination).
        // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
        //
        // expires: new Date(Date.now() + 60_000),
        httpOnly: true,
        maxAge: 2592000, // One month
        path: "/",
        sameSite: "strict",
        secrets: [process.env.SESSION_SECRET!],
        secure: true,
    },
});

export {getSession, commitSession, destroySession};
