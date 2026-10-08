
import { SB } from './saser.js';

const STATUSES = [
    { key: 'available', label: 'Available' },
    { key: 'occupied', label: 'Occupied' },
    { key: 'cleaning', label: 'Cleaning' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'other', label: 'Other' },
];
const LABEL = Object.fromEntries(STATUSES.map(s => [s.key, s.label]));
const FLOOR_ORDER = ['Ground', 'First'];   // add 'Second', ... if you add floors

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    Object.assign(n, props);
    kids.forEach(k => n.append(k));
    return n;
};

let rooms = [];
let selected = null;

const floorRank = (f) => { const i = FLOOR_ORDER.indexOf(f); return i === -1 ? 99 : i; };
const floorTitle = (f) => (f === 'Unassigned' ? 'No floor set' : `${f} floor`);

function renderLegend() {
    const legend = $('#legend');
    legend.replaceChildren(...STATUSES.map(s => {
        const n = rooms.filter(r => r.status === s.key).length;
        const chip = el('span', { className: 'chip' });
        chip.dataset.status = s.key;
        chip.append(el('i'), s.label + ' ', el('b', { textContent: n }));
        return chip;
    }));
}

function renderFloors() {
    const box = $('#floors');
    if (!rooms.length) {
        box.replaceChildren(el('div', { className: 'msg', textContent: 'No rooms found. Log in as the owner or staff of this hotel.' }));
        return;
    }
    const byFloor = {};
    rooms.forEach(r => (byFloor[r.floor || 'Unassigned'] ??= []).push(r));
    const names = Object.keys(byFloor).sort((a, b) => floorRank(a) - floorRank(b) || a.localeCompare(b));

    box.replaceChildren(...names.map(name => {
        const list = byFloor[name].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
        const free = list.filter(r => r.status === 'available').length;

        const head = el('div', { className: 'floor-head' },
            el('h2', { textContent: floorTitle(name) }),
            el('span', { textContent: `${free} of ${list.length} available` }));

        const grid = el('div', { className: 'grid' }, ...list.map(r => {
            const b = el('button', { className: 'room', type: 'button' },
                el('span', { className: 'no', textContent: r.room_number }),
                el('span', { className: 'type', textContent: r.room_type || '' }));
            b.dataset.status = r.status;
            b.setAttribute('aria-label', `Room ${r.room_number}, ${r.room_type || 'room'}, ${LABEL[r.status] || r.status}`);
            b.onclick = () => openSheet(r);
            return b;
        }));

        return el('section', { className: 'floor' }, head, grid);
    }));
}

function render() { renderLegend(); renderFloors(); }

function openSheet(r) {
    selected = r;
    $('#sheet-title').textContent = `Room ${r.room_number}`;
    const bits = [r.room_type, r.base_rate != null ? `₹${Number(r.base_rate)}` : null,
    r.max_occupancy ? `sleeps ${r.max_occupancy}` : null].filter(Boolean);
    $('#sheet-sub').textContent = bits.join(', ');
    $('#sheet-opts').replaceChildren(...STATUSES.map(s => {
        const b = el('button', { className: 'opt', type: 'button' },
            el('span', { textContent: s.label }),
            el('span', { textContent: r.status === s.key ? 'Current' : '' }));
        b.dataset.status = s.key;
        b.setAttribute('aria-pressed', r.status === s.key);
        b.onclick = () => setStatus(r, s.key);
        return b;
    }));
    $('#sheet').showModal();
}
$('#sheet-cancel').onclick = () => $('#sheet').close();
$('#sheet').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

let toastTimer;
function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

async function setStatus(r, status) {
    if (r.status === status) { $('#sheet').close(); return; }
    const prev = r.status;
    r.status = status; render(); $('#sheet').close();

    const { data, error } = await SB.from('rooms').update({ status }).eq('id', r.id).select('id');
    if (error || !data?.length) {
        r.status = prev; render();
        toast(`Couldn't update room ${r.room_number}. ${error ? error.message : 'No permission.'}`);
    } else {
        toast(`Room ${r.room_number} is now ${LABEL[status].toLowerCase()}`);
    }
}

async function load() {
    const { data, error } = await SB.from('rooms')
        .select('id, room_number, room_type, floor, status, base_rate, max_occupancy');
    if (error) {
        $('#floors').replaceChildren(el('div', { className: 'msg', textContent: `Couldn't load rooms. ${error.message}` }));
        return;
    }
    rooms = data;
    render();
}

load();
setInterval(() => { if (!$('#sheet').open) load(); }, 15000);
