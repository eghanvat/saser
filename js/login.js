import { SB } from './saser.js'

const params = new URLSearchParams(window.location.search);
const referrer = document?.referrer ? document.referrer : false;
const redirect = params.get('redirect');

var redirectTo = "index.html";


if (redirect || referrer) {
  redirectTo = redirect ? redirect : referrer ? referrer : 'index.html'
}


let currentEmail = '';

$('#send-btn').on('click', async () => {
  const email = $('#email-id').val().trim();
  $('#email-error').hide();
  if (!email || !email.includes('@')) {
    $('#email-error').text('Enter a valid email.');
    $('#email-error').show()
    return;
  }
  $('#send-btn').disabled = true;
  $('#send-btn').text('Sending otp …');

  const { error } = await SB.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });

  $('#send-btn').disabled = false;
  $('#send-btn').text('Login');

  if (error) {
    $('#email-error')[0].textContent = error.message.includes('Signups not allowed')
      ? "That email isn't registered as staff."
      : error.message;
    $('#email-error').show();
    return;
  }

  currentEmail = email;
  $('#sub').text(`Code sent to ${email}`);
  $('#emailLogin').hide()
  $('#step-otp').show()
});

$('#verify-btn').on('click', async () => {
  const token = $('#otp-input').val().trim();
  $('#otp-error').hide();

  if (!token || token.length < 6) {
    $('#otp-error').text('Enter the 6-digit code.');
    $('#otp-error').show()
    return;
  }
  $('verify-btn').disabled = true;
  $('verify-btn').text('Verifing Otp ... ');

  const { error } = await SB.auth.verifyOtp({
    email: currentEmail,
    token,
    type: 'email'
  });

  $('verify-btn').disabled = false;
  $('verify-btn').text('Verify and log in');

  if (error) {
    $('#otp-error').text('Incorrect or expired code.');
    $('#otp-error').show();
    return;
  }

  window.location.href = redirectTo;
});

$('#back-link').on('click', () => {
  $('#step-otp').hide()
  $('#emailLogin').show();
  $('#email-id').val('Email')
  $('#sub').text('Enter new email');
  $('#otp-input').val('');
});

async function handleCredentialResponse(response) {
  const { data, error } = await SB.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential,
  })
  if (error) {
    console.error(error);
  }
  else {
    console.log('Logged in:', data.user)
    window.location.href = redirectTo;
  }
}

window.handleCredentialResponse = handleCredentialResponse;

window.onGoogleLibraryLoad = function () {
  console.log("glib called")
  google.accounts.id.initialize({
    client_id: "252529151792-gpbslbg857o3l1eecsehrglc4vnk28db.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    auto_select: false,
  })
  google.accounts.id.renderButton(document.getElementById('g_id_signin'), {
    theme: 'outline', size: 'large', width:
      '284px'
  })
};

const googleScript = document.createElement("script");
googleScript.src = "https://accounts.google.com/gsi/client";
googleScript.async = true;
googleScript.defer = true;

document.head.appendChild(googleScript);