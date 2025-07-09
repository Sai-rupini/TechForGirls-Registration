const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJgPloC92tbAaH40VBZr2vh1lfBdlpb3oLmzt_7g54C6O6ThgtCRo5jcB0GR317C5ClQ/exec';

const registrationForm = document.getElementById('registrationForm');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const collegeInput = document.getElementById('college');
const whatsappShareBtn = document.getElementById('whatsappShareBtn');
const whatsappCounter = document.getElementById('whatsappCounter');
const whatsappMessage = document.getElementById('whatsappMessage');
const screenshotInput = document.getElementById('screenshot');
const screenshotFileNameDisplay = document.getElementById('screenshotFileName');
const submitBtn = document.getElementById('submitBtn');
const submissionMessage = document.getElementById('submissionMessage');
const errorMessage = document.getElementById('errorMessage');

let whatsappClickCount = 0;
const MAX_CLICKS = 5;
const WHATSAPP_MESSAGE = "Hey Buddy, Join Tech For Girls Community! It's an amazing initiative for women in tech. Check it out: ";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function initializeForm() {
  if (localStorage.getItem('techForGirlsSubmitted') === 'true') {
    disableForm();
    submissionMessage.classList.remove('hidden');
    return;
  }

  const storedCount = localStorage.getItem('whatsappClickCount');
  if (storedCount) {
    whatsappClickCount = parseInt(storedCount, 10);
  }
  updateWhatsAppCounter();
}

function updateWhatsAppCounter() {
  whatsappCounter.textContent = `Click count: ${whatsappClickCount}/${MAX_CLICKS}`;
  if (whatsappClickCount >= MAX_CLICKS) {
    whatsappShareBtn.disabled = true;
    whatsappShareBtn.classList.add('opacity-50', 'cursor-not-allowed');
    whatsappMessage.classList.remove('hidden');
  } else {
    whatsappShareBtn.disabled = false;
    whatsappMessage.classList.add('hidden');
  }
  localStorage.setItem('whatsappClickCount', whatsappClickCount.toString());
}

function disableForm() {
  Array.from(registrationForm.elements).forEach(elem => {
    elem.disabled = true;
    elem.classList.add('opacity-50', 'cursor-not-allowed');
  });
}

whatsappShareBtn.addEventListener('click', () => {
  if (whatsappClickCount < MAX_CLICKS) {
    const currentFormUrl = window.location.href;
    const fullMessage = `${WHATSAPP_MESSAGE}${currentFormUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    window.open(whatsappUrl, '_blank');

    whatsappClickCount++;
    updateWhatsAppCounter();
  }
});

screenshotInput.addEventListener('change', () => {
  const file = screenshotInput.files[0];
  if (file) {
    screenshotFileNameDisplay.textContent = `Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      screenshotFileNameDisplay.textContent += ' - File is too large!';
      screenshotFileNameDisplay.classList.add('text-red-600');
    } else {
      screenshotFileNameDisplay.classList.remove('text-red-600');
    }
  } else {
    screenshotFileNameDisplay.textContent = '';
  }
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

registrationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMessage.classList.add('hidden');
  submissionMessage.classList.add('hidden');

  if (whatsappClickCount < MAX_CLICKS) {
    errorMessage.textContent = 'Please complete the WhatsApp sharing (5/5 clicks) before submitting.';
    errorMessage.classList.remove('hidden');
    return;
  }

  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  let screenshotData = null, mimeType = null, fileName = 'N/A';
  if (screenshotInput.files.length > 0) {
    const file = screenshotInput.files[0];
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errorMessage.textContent = `File too large. Max allowed is 5MB.`;
      errorMessage.classList.remove('hidden');
      submitBtn.textContent = 'Submit Registration';
      submitBtn.disabled = false;
      return;
    }
    try {
      screenshotData = await readFileAsBase64(file);
      mimeType = file.type;
      fileName = file.name;
    } catch {
      errorMessage.textContent = 'Error reading file.';
      errorMessage.classList.remove('hidden');
      submitBtn.textContent = 'Submit Registration';
      submitBtn.disabled = false;
      return;
    }
  }

  const data = {
    name: nameInput.value,
    phone: phoneInput.value,
    email: emailInput.value,
    college: collegeInput.value,
    screenshotFileName: fileName,
    screenshotBase64: screenshotData,
    screenshotMimeType: mimeType
  };

  try {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    localStorage.setItem('techForGirlsSubmitted', 'true');
    disableForm();
    submissionMessage.classList.remove('hidden');
    submitBtn.textContent = 'Submitted!';
  } catch {
    errorMessage.textContent = 'Error during submission.';
    errorMessage.classList.remove('hidden');
    submitBtn.textContent = 'Submit Registration';
    submitBtn.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', initializeForm);
