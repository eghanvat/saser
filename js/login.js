const params = new URLSearchParams(window.location.search);
const referrer = document?.referrer ? document.referrer : false;
const redirect = params.get('redirect');

var redirectTo = "index.html";


if (redirect || referrer) {
  redirectTo = redirect ? redirect : referrer ? referrer : 'index.html'
}

if (window.google?.accounts?.id) {
  google.accounts.id.initialize({
    client_id: "252529151792-gpbslbg857o3l1eecsehrglc4vnk28db.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    auto_select: false,
  })
  google.accounts.id.renderButton(document.getElementById('g_id_signin'), { theme: 'filled_blue', size: 'large', width: '284px' })
}

let currentEmail = '';

$('#send-btn').on('click', async () => {
  const email = el('email').value.trim();
  el('email-error').style.display = 'none';
  if (!email || !email.includes('@')) {
    el('email-error').textContent = 'Enter a valid email.';
    el('email-error').style.display = 'block';
    return;
  }
  el('send-btn').disabled = true;
  el('send-btn').textContent = 'Sending…';
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });
  el('send-btn').disabled = false;
  el('send-btn').textContent = 'Send code';
  if (error) {
    el('email-error').textContent = error.message.includes('Signups not allowed')
      ? "That email isn't registered as staff."
      : error.message;
    el('email-error').style.display = 'block';
    return;
  }
  currentEmail = email;
  el('sub').textContent = `Code sent to ${email}`;
  el('email').style.display = 'none';
  el('step-otp').style.display = 'block';
});

$('#verify-btn').on('click', async () => {
  const token = el('otp-input').value.trim();
  el('otp-error').style.display = 'none';
  if (!token || token.length < 6) {
    el('otp-error').textContent = 'Enter the 6-digit code.';
    el('otp-error').style.display = 'block';
    return;
  }
  el('verify-btn').disabled = true;
  el('verify-btn').textContent = 'Verifying…';
  const { error } = await sb.auth.verifyOtp({
    email: currentEmail,
    token,
    type: 'email'
  });
  el('verify-btn').disabled = false;
  el('verify-btn').textContent = 'Verify and log in';
  if (error) {
    el('otp-error').textContent = 'Incorrect or expired code.';
    el('otp-error').style.display = 'block';
    return;
  }
  window.location.href = redirectTo;
});

$('#back-link').on('click', () => {
  el('step-otp').style.display = 'none';
  el('email').style.display = 'block';
  el('sub').textContent = 'Enter your work email to get a code';
  el('otp-input').value = '';
});

async function handleCredentialResponse(response) {
  const { data, error } = await sb.auth.signInWithIdToken({
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

