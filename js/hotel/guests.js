import { SB } from '../saser.js';

(async () => {
    document.body.style.visibility = 'hidden';   // or CSS: body{visibility:hidden}
    const ctx = await guard();
    if (!ctx) return;
    console.log(ctx);
    //hotelId = ctx.hotelId;                       // reuses the earlier variable
    document.body.style.visibility = 'visible';
    init(ctx.user);                                      // load rooms, check-ins, etc.
})();

async function init(user) {
    let uid = user.id;
    let info = {};

    const [{ data: hotel }, { data: st }, error] = await Promise.all([
        SB.from('hotels').select('id').eq('owner_id', uid).maybeSingle(),
        SB.from('staff').select('hotel_id, role').eq('id', uid).maybeSingle(),
    ]);

    if (error) {
        console.error(error);
    } else {
        if (hotel || st) info = { hotelId: hotel.id, role: 'owner' }
        if (st) info = { hotelId: st.hotel_id, role: st.role }
        loadGuests(info);
    }
}

// SB.auth.onAuthStateChange((event, session) => {
//     if (!session) {
//         window.location.href = '/auth/login.html?redirect=/hotel/guests.html';
//     } else {
//         window.session = session;
//         if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') setTimeout(loadGuests, 0);
//     }
// });

// guests who checked in today (device local day, IST on your phones)

async function loadGuests(id) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);

    const { data, error } = await SB
        .from('guests')
        .select('id, full_name, email, phone, room_id, check_in, check_out, rooms(room_number)')
        .eq('hotel_id', id.hotelId)
        .gte('check_in', start.toISOString())
        .lt('check_in', end.toISOString())
        .order('check_in', { ascending: false });

    if (error) {
        console.error(error);
        $('#main').textContent = 'Error loading guests.';
    } else {
        if (data && data.length) {
            $('#today-guest').empty().append(...data.map(guest => `
                <div class="guest">
                <p>Room ${guest.rooms?.room_number || 'N/A'}</p>
                    <p>${guest.full_name}</p>
                    <p>${new Date(guest.check_in).toLocaleString()}</p>
                    <p>${new Date(guest.check_out).toLocaleString()}</p>
                </div>
            `));
        }
    }
}