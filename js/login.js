const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect') || 'kitchen.html';

  const el = id => document.getElementById(id);
  let currentEmail = '';

  el('send-btn').onclick = async () => {
    const email = el('email-input').value.trim();
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
    el('step-email').style.display = 'none';
    el('step-otp').style.display = 'block';
  };

  el('verify-btn').onclick = async () => {
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
  };

  el('back-link').onclick = () => {
    el('step-otp').style.display = 'none';
    el('step-email').style.display = 'block';
    el('sub').textContent = 'Enter your work email to get a code';
    el('otp-input').value = '';
  };
