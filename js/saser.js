// Import Supabase directly from the CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';


//variables
const login = "/auth/login.html";

//short
window.loggedIn = false;
window.$ = $;

//connections
window.SUPABASE_URL = "https://rysxztcnnfxtuikymvyd.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_9F7WBGfcVF9lYrEx9x7l_w_8hjhNNmq";
window.VENDOR_ID = "d1100148-64b4-4d41-8930-af7029aa7726";

window.sb = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

//sesions
async function checkAuth() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        //window.location.href = login + 'redirect=' + encodeURIComponent(window.location.pathname);
        return null;
    }
    return session;
}

function signOut() {
    sb.auth.signOut().then(() => location.href = '/');
}


//logined bar
$('.logoutBtn').on('click', signOut);
const $thirdLink = $('.nav-links a:nth-child(4)');

sb.auth.onAuthStateChange((event, session) => {
    // The listener directly hands you the fresh session. 
    // No need to call checkAuth() or getSession() here!
    if (!session) {
        loggedIn = false;
        $('.topbar').addClass('hidden');
        $thirdLink.show();
    } else {
        loggedIn = true;
        const displayName = session.user.user_metadata?.full_name
            || session.user.user_metadata?.name
            || session.user.email;
        $('.topbar .username').text(displayName);
        $('.topbar').removeClass('hidden');
        $thirdLink.hide();
    }
});

//common functions across 
window.checkAuth = checkAuth;
window.signOut = signOut;