// Import Supabase directly from the CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';


//variables
const login = "/auth/login.html";

//short
window.loggedIn = false;
window.$ = $;

//connections
export const SUPA = {
    URL: "https://rysxztcnnfxtuikymvyd.supabase.co",
    ANON_KEY: "sb_publishable_9F7WBGfcVF9lYrEx9x7l_w_8hjhNNmq",
    VENDOR_ID: "d1100148-64b4-4d41-8930-af7029aa7726"
}
export const SB = createClient(SUPA.URL, SUPA.ANON_KEY);


//sesions
async function checkAuth() {
    const { data: { session } } = await SB.auth.getSession();
    if (!session) {
        //window.location.href = login + 'redirect=' + encodeURIComponent(window.location.pathname);
        return null;
    }
    return session;
}

function signOut() {
    SB.auth.signOut().then(() => location.href = '/');
}


//logined bar
$('.logoutBtn').on('click', signOut);

const $thirdLink = $('.nav-links a:nth-child(4)');

SB.auth.onAuthStateChange((event, session) => {
    // The listener directly hands you the fresh session. 
    // No need to call checkAuth() or getSession() here!
    if (!session) {
        loggedIn = false;
        $('.topbar').addClass('hidden');
        $thirdLink.show();
    } else {
        loggedIn = true;
        const fullName = session.user.user_metadata?.full_name
            || session.user.user_metadata?.name

        const rawName = fullName
            ? fullName.split(' ')[0]
            : session.user.email.split('@')[0];

        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

        const avatarUrl = session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture;

        // Use avatarUrl in your image tag
        console.log(avatarUrl);

        $('.topbar .user .username').text(displayName);
        $('.topbar .profile').attr('src', avatarUrl);
        $('.topbar').removeClass('hidden');
        $thirdLink.hide();
    }
});

$('.topbar .user').click(function () {
    $('.topbar').toggleClass('expand shrink');
})


//common functions across 
window.checkAuth = checkAuth;
window.signOut = signOut;