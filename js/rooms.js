import { nowDT, SB } from './saser.js'

var x = nowDT.split(' at ');
console.log(x);

$('#nowD').text(x[0]);
$('#nowT').text(x[1])

$('#contact').click(function () {
    window.location.href = '/contact';
})

function updateClock() {
    // 1. Get the current date and time
    var now = new Date();

    // 2. Format hours, minutes, and seconds to always have two digits
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');

    // 3. Combine into a time string
    var currentTime = hours + ":" + minutes + ":" + seconds;

    // 4. Update the element's text content using jQuery .text()
    $("#nowT").text(currentTime);
}

updateClock();
setInterval(updateClock, 1000);

const SHOW = ['available', 'cleaning', 'other'];

async function showAvailable() {
    let box = document.getElementById('details-card')
    const { data, error } = await SB.rpc('public_rooms')
    //.select('room_number, status')
    //.in('status', SHOW);
    if (error) return (box.textContent = error.message);


    //console.log(data); // maintenance, cleaning, occupied are excluded

    const rooms = data
        .filter(r => SHOW.includes(r.status))
        .sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

    box.replaceChildren(...rooms.map(r => {
        const p = document.createElement('p');
        p.textContent = `Room ${r.room_number}: ${r.room_type}, ₹${Number(r.base_rate)} per night, sleeps ${r.max_occupancy} (${r.status})`;
        return p;
    }));

    if (data.length > 0) {
        $('.rooms').text(data.length);
    }

    //     const box = $('available-rooms');
    // if (error) return (box.textContent = error.message);

    // data.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
    // box.textContent = data.length
    //     ? 'Available: ' + data.map(r => r.room_number).join(', ')
    //     : 'No rooms available';
}

$('#details').click(function () {
    $('#details-card').show();
})

showAvailable();
setInterval(showAvailable, 30000);       // refresh every 30 s