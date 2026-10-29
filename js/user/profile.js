import { SB } from '../saser.js';

(async () => {
    document.body.style.visibility = 'hidden';   // or CSS: body{visibility:hidden}
    const ctx = await guard();
    if (!ctx) return;
    document.body.style.visibility = 'visible';
    init(ctx.user);                                      // load rooms, check-ins, etc.
})();

async function init(user) {
    let avatarUrl = '/img/male-p.jpeg';

    const { data: row } = await SB
        .from('app_users').select('avatar_path')
        .eq('auth_user_id', user.id).maybeSingle();

    let role = await getUserRole(user.id);

    if (row?.avatar_path) {
        const { data, error } = await SB.storage
            .from('profile').createSignedUrl(row.avatar_path, 3600);
        if (!error) {
            avatarUrl = data.signedUrl;
        } else {
            console.error(error);
        }
    }

    const fullName = user.user_metadata?.full_name
        || user.user_metadata?.name;

    $('#p-img').attr('src', avatarUrl);
    $('#p-name').text(fullName || 'User');
    $('#p-role').text(role.type || 'Customer');

    console.log(role.type);

    if (role.type == 'owner') {
        $('#manage').show();
        $('#kitchen').show();
    }

    if (role.type === 'staff') {
        if (role.staffRole === 'admin') {
            $('#manage').show();
        }
        if (role.staffRole === 'cook') {
            $('#kitchen').show();
        }
        if (role.staffRole === 'help') {
            $('#help').show();
        }
    }


}

async function getUserRole(userId) {
    const [{ data: hotel }, { data: st }] = await Promise.all([
        SB.from('hotels').select('hotel_id').eq('owner_id', userId).limit(1).maybeSingle(),
        SB.from('staff').select('hotel_id, role').eq('id', userId).limit(1).maybeSingle(),
    ]);

    if (hotel) return { type: 'owner', hotelId: hotel.hotel_id };
    if (st) return { type: 'staff', hotelId: st.hotel_id, staffRole: st.role }; // admin | cook | help
    return { type: 'customer', hotelId: null };
}