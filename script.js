// Dentflow Interactive Client Side Engine
document.addEventListener('DOMContentLoaded', () => {
  // 1. Patient SMS Booking Simulator Logic
  const smsChatHistory = document.getElementById('sms-chat-history');
  const optionSelectContainer = document.getElementById('option-select-container');
  const calendarTargetCell = document.getElementById('calendar-target-cell');
  const liveCountBadge = document.getElementById('live-count-badge');

  const optionsHTML = `
    <button class="booking-option" onclick="selectBookingOption('Monday, Oct 12 at 9:00 AM')">
      A) Monday, Oct 12 @ 9:00 AM (Dr. Reynolds - Chair 1)
    </button>
    <button class="booking-option" onclick="selectBookingOption('Monday, Oct 12 at 11:30 AM')">
      B) Monday, Oct 12 @ 11:30 AM (Dr. Reynolds - Chair 1)
    </button>
    <button class="booking-option" onclick="selectBookingOption('Tuesday, Oct 13 at 2:15 PM')">
      C) Tuesday, Oct 13 @ 2:15 PM (Hygienist Sarah - Chair 2)
    </button>
  `;

  window.selectBookingOption = (selectedTime) => {
    // Disable other clicks
    optionSelectContainer.innerHTML = '';

    // Append patient choice bubble
    const patientBubble = document.createElement('div');
    patientBubble.className = 'chat-bubble patient flex flex-col self-end';
    patientBubble.innerText = `I'll take option: ${selectedTime}. Thank you!`;
    smsChatHistory.appendChild(patientBubble);
    smsChatHistory.scrollTop = smsChatHistory.scrollHeight;

    // Simulate system thinking
    setTimeout(() => {
      const typingBubble = document.createElement('div');
      typingBubble.className = 'chat-bubble dentflow italic';
      typingBubble.innerText = 'Dentflow AI is updating schedule...';
      smsChatHistory.appendChild(typingBubble);
      smsChatHistory.scrollTop = smsChatHistory.scrollHeight;

      setTimeout(() => {
        // Remove typing
        typingBubble.remove();

        // Add confirmation bubble
        const confirmBubble = document.createElement('div');
        confirmBubble.className = 'chat-bubble dentflow';
        confirmBubble.innerHTML = `<strong>System Confirmed:</strong> Booked! Calendar invited sent to your email. We will text you 48 hours before to confirm.`;
        smsChatHistory.appendChild(confirmBubble);
        smsChatHistory.scrollTop = smsChatHistory.scrollHeight;

        // Animate the simulated Office Manager Calendar Grid
        if (calendarTargetCell) {
          calendarTargetCell.innerHTML = `
            <div class="text-xs font-mono text-cyan-400 font-bold p-1 overflow-hidden whitespace-nowrap text-ellipsis">
              Sarah Jenkins (Hygiene)
            </div>
          `;
          calendarTargetCell.classList.add('filled');
          calendarTargetCell.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.4)';
        }

        // Show reset helper
        const resetBtn = document.createElement('button');
        resetBtn.className = 'text-xs text-slate-500 hover:text-cyan-400 mt-2 font-mono underline block text-center w-full';
        resetBtn.innerText = 'Reset Simulator';
        resetBtn.onclick = resetSimulator;
        optionSelectContainer.appendChild(resetBtn);
      }, 1200);

    }, 600);
  };

  function resetSimulator() {
    smsChatHistory.innerHTML = `
      <div class="chat-bubble dentflow">
        <strong>Dentflow Patient Assistant:</strong> Hi Sarah, you are overdue for your 6-month hygiene cleaning. Let's get you on the schedule. Please pick a time below that works best:
      </div>
    `;
    optionSelectContainer.innerHTML = optionsHTML;
    if (calendarTargetCell) {
      calendarTargetCell.innerHTML = `
        <span class="text-slate-700 text-xs font-mono block p-1">9:00 AM (Available)</span>
      `;
      calendarTargetCell.classList.remove('filled');
      calendarTargetCell.style.boxShadow = 'none';
    }
  }

  // Initial Simulator Setup
  if (optionSelectContainer) {
    optionSelectContainer.innerHTML = optionsHTML;
  }

  // 2. Pre-Authorization interactive tracking status toggle
  window.togglePreAuthStatus = (elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (el.innerText === 'SUBMITTED') {
      el.className = 'status-badge approved';
      el.innerText = 'APPROVED';
      // Show automatic action text notice
      const notice = document.createElement('div');
      notice.className = 'text-xs text-green-400 mt-1 font-mono transition-opacity duration-500';
      notice.innerText = 'Approved! Sent SMS booking invite automatically.';
      el.parentNode.appendChild(notice);
      setTimeout(() => notice.remove(), 4000);
    } else {
      el.className = 'status-badge pending';
      el.innerText = 'SUBMITTED';
    }
  };

  // 3. Form Capture to Lead Collector API Endpoint
  const waitlistForm = document.getElementById('waitlist-form');
  const formSuccessState = document.getElementById('form-success-state');
  const formSubmitBtn = document.getElementById('form-submit-btn');

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('waitlist-email');
      const nameInput = document.getElementById('waitlist-name');
      const clinicInput = document.getElementById('waitlist-clinic');

      const email = emailInput ? emailInput.value : '';
      const name = nameInput ? nameInput.value : '';
      const clinic = clinicInput ? clinicInput.value : '';

      if (!email) return;

      if (formSubmitBtn) {
        formSubmitBtn.disabled = true;
        formSubmitBtn.innerText = 'SECURED...';
      }

      try {
        const response = await fetch('https://app.baget.ai/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            companyId: '430e137c-96c4-4068-94f2-f4e0617fb2c7',
            email: email,
            name: `${name} | Clinic: ${clinic}`
          })
        });

        if (response.ok) {
          waitlistForm.classList.add('hidden');
          if (formSuccessState) {
            formSuccessState.classList.remove('hidden');
          }
          // Increment simulated live signup counter slightly to reward user action
          if (liveCountBadge) {
            const currentCount = parseInt(liveCountBadge.innerText.replace(/[^0-9]/g, '')) || 83;
            liveCountBadge.innerText = `${currentCount + 1} independent clinics registered`;
          }
        } else {
          alert('Submission error. Please try again or reach support@dentflow.co.');
          if (formSubmitBtn) {
            formSubmitBtn.disabled = false;
            formSubmitBtn.innerText = 'JOIN EXCLUSIVE WAITLIST';
          }
        }
      } catch (err) {
        console.error(err);
        alert('Could not submit form. Please check your network and try again.');
        if (formSubmitBtn) {
          formSubmitBtn.disabled = false;
          formSubmitBtn.innerText = 'JOIN EXCLUSIVE WAITLIST';
        }
      }
    });
  }
});
