import { nowDT } from './saser.js'

var x = nowDT.split(' at ');
console.log(x);

$('#nowD').text(x[0]);
$('#nowT').text(x[1])

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