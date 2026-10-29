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

let staff;

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
            staff = data;
            $('#today-guest').empty().append(...data.map(staff => `
                <div class="staff">
                    <p>${staff.full_name}</p>
                    <p>${staff.role}</p>
                    <p>${new Date(staff.created_at).toLocaleString()}</p>
                    <button  data-id="${staff.id}" id='remove-${staff.id}' class="btn btn-danger">Remove</button>
                    <button  data-id="${staff.id}" id='edit-${staff.id}' class="btn btn-primary">Edit</button>
                </div>
            `));
        }
    }
}
let qTimeout;

$('#email').on('input', function () {
    if ($(this).val().trim().length >= 2) {
        clearTimeout(qTimeout);
        qTimeout = setTimeout(searchStaff, 300);
    }

});

async function searchStaff() {
    let c = await SB.rpc('search_users', { p_q: $('#email').val().trim() })

    if (c.error) {
        console.error(error);
    } else {
        if (c.data && c.data.length) {
            showUsers(c.data);
        }
    }

}

$(document).on('click', '.btn', function () {
    var id = $(this).data('id');
    var btnId = $(this).attr('id') || '';

    btnId.includes('remove') ? removeStaff(id) : editStaff(id);
});



function removeStaff(id) {
    console.log(id);
    SB.from('staff').delete().eq('id', id).then(({ data, error }) => {
        if (error) {
            console.error(error);
        } else {
            $(`#remove-${id}`).closest('.staff').remove();
        }
    });
}

function editStaff(id) {
    // Implement edit functionality here
    $('#addBtn').text('Update');

    if (staff && staff.length) {
        staff.forEach(element => {
            if (element.id === id) {
                $('#name').val(element.full_name);
                $('#role').val(element.role);
                $('#email, #phone').hide();
                $('#type option').filter(function () {
                    return $(this).text().toLowerCase().trim() === element.role.toLowerCase;
                }).prop('selected', true)
            }
        });
    }
    $('#c-staff').show();

    //$('#name').val(staff)
    //$('#email').val(''); // Clear email input
    //$('#phone').val('');
}

function showUsers(users) {
    // Implement user display functionality here// 1. Define your array
    var matches = users.map(user => user.full_name); // Assuming each user object has an 'email' property

    // 2. Target your <select> dropdown element
    var dropdown = $('#resultsList');
    dropdown.empty(); // Clear existing options


    // Build and show the list if matches exist
    if (matches.length > 0) {
        $.each(matches, function (i, val) {
            dropdown.append('<li>' + val + '</li>');
        });
        dropdown.show();
    }

    // Click event: Select value from the list
    $(document).on('click', '#resultsList li', function () {
        var selectedValue = $(this).text();
        $('#email').val(selectedValue);
        $('#resultsList').hide(); // Close the dropdown list
    });

    // Close list when clicking anywhere else outside the search box
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.wrap-sm').length) {
            $('#resultsList').hide();
        }
    });

}