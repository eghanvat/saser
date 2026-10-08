import { SB } from '../saser.js';

const STATUSES = [
    { key: 'available', label: 'Available' },
    { key: 'occupied', label: 'Occupied' },
    { key: 'cleaning', label: 'Cleaning' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'other', label: 'Other' },
];
const LABEL = Object.fromEntries(STATUSES.map(s => [s.key, s.label]));
const FLOOR_ORDER = ['Ground', 'First'];   // add 'Second', ... if you add floors
const RECENT_HOURS = 3

const el = (tag, props = {}, ...kids) => {
    const n = $('<' + tag + '>', props);
    kids.forEach(k => {
        // Only append if the child actually exists/contains value
        if (k !== undefined && k !== null && k !== false) {
            n.append(k);
        }
    });
    return n;
};

let rooms = [];
let selected = null;     // room currently open in the popup
let busy = false;

const floorRank = (f) => { const i = FLOOR_ORDER.indexOf(f); return i === -1 ? 99 : i; };
const floorTitle = (f) => (f === 'Unassigned' ? 'No floor set' : `${f} floor`);
const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`;
};

/* ---------- board ---------- */
function renderLegend() {
    $('#legend').empty().append(...STATUSES.map(s => {
        const n = rooms.filter(r => r.status === s.key).length;
        const chip = el('span', { class: 'chip' });
        chip.attr('data-status', s.key);
        chip.append(el('i'), s.label + ' ', el('b', { text: n }));
        return chip;
    }));
}

function renderFloors() {
    const box = $('#floors');
    if (!rooms.length) {
        box.empty().append(el('div', { class: 'msg', text: 'No rooms found. Log in as the owner or staff of this hotel.' }));
        return;
    }
    const byFloor = {};
    rooms.forEach(r => (byFloor[r.floor || 'Unassigned'] ??= []).push(r));
    const names = Object.keys(byFloor).sort((a, b) => floorRank(a) - floorRank(b) || a.localeCompare(b));

    box.empty().append(...names.map(name => {
        const list = byFloor[name].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
        const free = list.filter(r => r.status === 'available').length;

        const head = el('div', { class: 'floor-head' },
            el('h2', { text: floorTitle(name) }),
            el('span', { text: `${free} of ${list.length} available` }));

        const grid = el('div', { class: 'grid' }, ...list.map(r => {
            const b = el('button', { class: 'room', type: 'button' },
                el('span', { class: 'no', text: r.room_number }),
                el('span', { class: 'type', text: r.room_type || '' }));
            b.attr('data-status', r.status);
            b.attr('aria-label', `Room ${r.room_number}, ${r.room_type || 'room'}, ${LABEL[r.status] || r.status}`);
            b.on('click', () => openSheet(r));
            return b;
        }));

        return el('section', { class: 'floor' }, head, grid);
    }));
}

function render() { renderLegend(); renderFloors(); }

let toastTimer;
function toast(msg) {
    const t = $('#toast');
    t.text(msg);
    if (!t[0].matches(':popover-open')) t[0].showPopover();   // shows above the open dialog
    t.addClass('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.removeClass('show'); t[0].hidePopover(); }, 3000);
}

/* ---------- popup ---------- */
const row = (title, sub, btnText, onClick, { disabled = false, out = false } = {}) => {
    const b = el('button', { class: 'act' + (out ? ' out' : ''), type: 'button', text: btnText, disabled });
    b.on('click', onClick);
    return el('div', { class: 'row' },
        el('div', { class: 'who' }, el('b', { text: title }), el('span', { text: sub })), b);
};
const note = (t) => el('div', { class: 'empty', text: t });

function paintHeader() {
    const r = selected;
    $('#sheet-title').text(`Room ${r.room_number}`);
    $('.price-box').val(r.base_rate)

    const bits = [r.room_type, r.base_rate != null ? `₹${Number(r.base_rate)}` : null,
    r.max_occupancy ? `sleeps ${r.max_occupancy}` : null].filter(Boolean);
    $('#sheet-sub').text(bits.join(', '));

    $('#sheet-opts').empty().append(...STATUSES.map(s => {
        const b = el('button', { class: 'opt', type: 'button', text: s.label });
        b.attr('data-status', s.key);
        b.attr('aria-pressed', r.status === s.key);
        b.on('click', () => setStatus(r, s.key));
        return b;
    }));
}

let paintTok = 0;
async function paintLists() {
    const r = selected;
    const tok = ++paintTok;
    const q = $('#q').val().trim();
    const [g, u] = await Promise.all([
        SB.rpc('room_guests', { p_room_id: r.id }),
        q.length >= 2 ? SB.rpc('search_users', { p_q: q })
            : SB.rpc('recent_logins', { p_hours: RECENT_HOURS }),
    ]);
    if (!selected || selected.id !== r.id || tok !== paintTok) return;   // closed, changed room, or newer keystroke

    const guests = g.data || [];
    $('#in-room').empty().append(...(g.error ? [note(g.error.message)]
        : guests.length ? guests.map(x => row(x.full_name, `checked in ${ago(x.check_in)}`, 'Check out', () => checkOut(x.guest_id), { out: true }))
            : [note('Nobody checked in.')]));

    const full = r.max_occupancy && guests.length >= r.max_occupancy;
    const users = u.data || [];
    const searching = q.length >= 2;
    $('#recent').empty().append(...(u.error ? [note(u.error.message)]
        : users.length ? users.map(x => row(
            x.full_name,
            [x.phone || x.email, x.last_sign_in_at ? `logged in ${ago(x.last_sign_in_at)}` : 'never logged in'].filter(Boolean).join(', '),
            full ? 'Full' : 'Add',
            () => (x.app_user_id ? checkInApp(x.app_user_id) : checkIn(x.user_id)),
            { disabled: full }))
            : [note(searching ? 'Nobody found.' : `No one has logged in during the last ${RECENT_HOURS} hours. Search above.`)]));

    $('#newbox').empty().append(...(searching && !u.error && !users.length ? [newGuestBox(q, full)] : []));
}

function newGuestBox(q, full) {
    const isEmail = q.includes('@');
    const email = el('input', { type: 'email', placeholder: 'Email', value: isEmail ? q : '', autocomplete: 'off' });
    const name = el('input', { type: 'text', placeholder: 'Name (optional)', value: isEmail ? '' : q, autocomplete: 'off' });
    const btn = el('button', { class: 'act', type: 'button', text: full ? 'Room is full' : 'Save and add to room', disabled: !!full });
    btn.on('click', () => addNew(email.val().trim(), name.val().trim()));
    return el('div', { class: 'newbox' }, note('Not found. Add as a new guest:'), email, name, btn);
}

async function addNew(email, name) {
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Enter a valid email');
    busy = true;
    const a = await SB.rpc('add_manual_user', { p_email: email, p_full_name: name || null, p_phone: null });
    if (a.error) { busy = false; return toast(a.error.message); }
    const c = await SB.rpc('check_in_app_user', { p_room_id: selected.id, p_app_user_id: a.data });
    busy = false;
    if (c.error) return toast(c.error.message);
    $('#q').val('');
    await afterChange(`Guest added to room ${selected.room_number}`);
}

async function checkInApp(appUserId) {
    if (busy) return; busy = true;
    const { error } = await SB.rpc('check_in_app_user', { p_room_id: selected.id, p_app_user_id: appUserId });
    busy = false;
    if (error) return toast(error.message);
    await afterChange(`Guest added to room ${selected.room_number}`);
}

let qTimer;
$('#q').on('input', () => { clearTimeout(qTimer); qTimer = setTimeout(() => selected && paintLists(), 300); });

function openSheet(r) {
    selected = r;
    $('#q').val('');
    $('#newbox').empty().append();
    paintHeader();
    $('#in-room').empty().append(note('Loading…'));
    $('#recent').empty().append(note('Loading…'));
    $('#sheet')[0].showModal();
    paintLists();
}
const closeSheet = () => { selected = null; $('#sheet')[0].close(); };
$('#sheet-cancel').on('click', closeSheet)
$('#sheet').on('close', () => { selected = null; });
//$('#sheet').on('click', (e) => { if (e.target === e.currentTarget) closeSheet(); });

async function afterChange(msg) {
    if (msg.startsWith('Guest added')) $('#q').val('');
    await load();
    if (selected) { selected = rooms.find(x => x.id === selected.id) || selected; paintHeader(); await paintLists(); }
    toast(msg);
}

async function checkIn(userId) {
    if (busy) return; busy = true;
    const { error } = await SB.rpc('check_in_guest', { p_room_id: selected.id, p_auth_user_id: userId });
    busy = false;
    if (error) return toast(error.message);
    await afterChange(`Guest added to room ${selected.room_number}`);
}

async function checkOut(guestId) {
    if (busy) return; busy = true;
    const { error } = await SB.rpc('check_out_guest', { p_guest_id: guestId });
    busy = false;
    if (error) return toast(error.message);
    await afterChange('Guest checked out');
}

async function setStatus(r, status) {
    if (r.status === status) return;
    const prev = r.status;
    r.status = status; render(); paintHeader();
    const { data, error } = await SB.from('rooms').update({ status }).eq('id', r.id).select('id');
    if (error || !data?.length) {
        r.status = prev; render(); paintHeader();
        toast(`Couldn't update room ${r.room_number}. ${error ? error.message : 'No permission.'}`);
    } else {
        toast(`Room ${r.room_number} is now ${LABEL[status].toLowerCase()}`);
    }
}

async function load() {
    const { data, error } = await SB.from('rooms')
        .select('id, room_number, room_type, floor, status, base_rate, max_occupancy');
    if (error) {
        //s$('#floors').append(el('div', { class: 'msg', textContent: `Couldn't load rooms. ${error.message}` }));
        return;
    }
    rooms = data;
    render();
}

load();
setInterval(() => { if (!$('#sheet').open) load(); }, 15000);
