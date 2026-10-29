import { SB } from '../saser.js';

(async () => {
    document.body.style.visibility = 'hidden';   // or CSS: body{visibility:hidden}
    const ctx = await guard();
    if (!ctx) return;
    document.body.style.visibility = 'visible';
    init(ctx.user);                                      // load rooms, check-ins, etc.
})();

async function init(user) {
    let uid = user.id;
    let info = {};

    const [{ data: hotel }, error] = await Promise.all([
        SB.from('hotels').select('hotel_id').eq('owner_id', uid).maybeSingle(),
    ]);

    if (error) {
        console.error(error);
    } else {
        if (hotel) info = { hotelId: hotel.hotel_id, role: 'owner' }
        loadGuests(info);
    }
}

async function loadGuests(id) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);

    const { data, error } = await SB
        .from('staff')
        .select('id,full_name, role, created_at')
        .eq('hotel_id', id.hotelId)

    if (error) {
        console.error(error);
        $('#today-guest').textContent = 'Error loading guests.';
    } else {
        if (data && data.length) {
            $('#today-guest').empty().append(...data.map(staff => `
                <div class="guest">
                    <p>${staff.full_name}</p>
                    <p>${staff.role}</p>
                    <p>${new Date(staff.created_at).toLocaleString()}</p>
                </div>
            `));
        }
    }
}