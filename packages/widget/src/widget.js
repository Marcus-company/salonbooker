/**
 * SalonBooker Widget
 * Embeddable booking widget for HairsalonX
 */

(function() {
  'use strict';

  // State
  let currentStep = 1;
  const totalSteps = 3;
  let selectedService = null;
  let selectedDate = null;
  let selectedTime = null;

  // DOM Elements
  const elements = {
    steps: {
      1: document.getElementById('step-1'),
      2: document.getElementById('step-2'),
      3: document.getElementById('step-3'),
    },
    summary: document.getElementById('summary'),
    success: document.getElementById('success'),
    btnNext: document.getElementById('btn-next'),
    btnBack: document.getElementById('btn-back'),
    calendarGrid: document.getElementById('calendar-grid'),
    currentMonth: document.getElementById('current-month'),
    prevMonth: document.getElementById('prev-month'),
    nextMonth: document.getElementById('next-month'),
    summaryService: document.getElementById('summary-service'),
    summaryDate: document.getElementById('summary-date'),
    summaryTime: document.getElementById('summary-time'),
    summaryPrice: document.getElementById('summary-price'),
  };

  // Initialize
  function init() {
    bindEvents();
    renderCalendar(new Date());
  }

  // Event Bindings
  function bindEvents() {
    // Service selection
    document.querySelectorAll('.sb-service-card').forEach(card => {
      card.addEventListener('click', () => selectService(card));
    });

    // Time slot selection
    document.querySelectorAll('.sb-time-slot').forEach(slot => {
      if (!slot.classList.contains('sb-time-slot-busy')) {
        slot.addEventListener('click', () => selectTime(slot));
      }
    });

    // Navigation
    elements.btnNext.addEventListener('click', nextStep);
    elements.btnBack.addEventListener('click', prevStep);

    // Calendar navigation
    elements.prevMonth.addEventListener('click', () => changeMonth(-1));
    elements.nextMonth.addEventListener('click', () => changeMonth(1));
  }

  // Service Selection
  function selectService(card) {
    document.querySelectorAll('.sb-service-card').forEach(c => {
      c.classList.remove('sb-service-selected');
    });
    card.classList.add('sb-service-selected');

    selectedService = {
      name: card.querySelector('.sb-service-name').textContent,
      price: card.dataset.price,
      duration: card.dataset.duration,
    };

    updateSummary();
  }

  // Time Selection
  function selectTime(slot) {
    document.querySelectorAll('.sb-time-slot').forEach(s => {
      s.classList.remove('sb-time-slot-selected');
    });
    slot.classList.add('sb-time-slot-selected');
    selectedTime = slot.textContent;
    updateSummary();
  }

  // Calendar Rendering
  let currentCalendarDate = new Date();

  function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Update header
    const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
                       'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    elements.currentMonth.textContent = `${monthNames[month]} ${year}`;

    // Clear grid
    elements.calendarGrid.innerHTML = '';

    // Day headers
    const dayHeaders = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
    dayHeaders.forEach(day => {
      const header = document.createElement('div');
      header.className = 'sb-calendar-day-header';
      header.textContent = day;
      elements.calendarGrid.appendChild(header);
    });

    // Calculate days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Adjust for Monday start
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Empty cells
    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      elements.calendarGrid.appendChild(empty);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('button');
      dayEl.className = 'sb-calendar-day';
      dayEl.textContent = day;

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(year, month, day);

      // Disable past dates
      if (currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        dayEl.disabled = true;
      }

      // Highlight today
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayEl.classList.add('sb-day-today');
      }

      // Sunday/Monday = closed
      if (currentDate.getDay() === 0 || currentDate.getDay() === 1) {
        dayEl.disabled = true;
      }

      dayEl.addEventListener('click', () => selectDate(dayEl, dateStr));
      elements.calendarGrid.appendChild(dayEl);
    }
  }

  function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar(currentCalendarDate);
  }

  function selectDate(dayEl, dateStr) {
    document.querySelectorAll('.sb-calendar-day').forEach(d => {
      d.classList.remove('sb-day-selected');
    });
    dayEl.classList.add('sb-day-selected');
    
    const date = new Date(dateStr);
    selectedDate = date.toLocaleDateString('nl-NL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
    updateSummary();
  }

  // Navigation
  function nextStep() {
    if (!validateStep(currentStep)) return;

    if (currentStep < totalSteps) {
      showStep(currentStep + 1);
    } else {
      submitBooking();
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  }

  function showStep(step) {
    // Hide current step
    elements.steps[currentStep].classList.add('sb-step-hidden');
    
    // Show new step
    currentStep = step;
    elements.steps[currentStep].classList.remove('sb-step-hidden');

    // Update buttons
    elements.btnBack.style.display = currentStep === 1 ? 'none' : 'block';
    elements.btnNext.textContent = currentStep === totalSteps ? 'Bevestig afspraak' : 'Volgende';

    // Show/hide summary
    elements.summary.style.display = currentStep === 1 ? 'none' : 'block';
  }

  function validateStep(step) {
    switch (step) {
      case 1:
        if (!selectedService) {
          alert('Selecteer eerst een behandeling');
          return false;
        }
        return true;
      case 2:
        if (!selectedDate || !selectedTime) {
          alert('Selecteer een datum en tijd');
          return false;
        }
        return true;
      case 3:
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        if (!name || !phone) {
          alert('Vul je naam en telefoonnummer in');
          return false;
        }
        return true;
    }
    return true;
  }

  function updateSummary() {
    elements.summaryService.textContent = selectedService?.name || '-';
    elements.summaryDate.textContent = selectedDate || '-';
    elements.summaryTime.textContent = selectedTime || '-';
    elements.summaryPrice.textContent = selectedService ? `€${selectedService.price}` : '-';
  }

  function submitBooking() {
    const bookingData = {
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      customer: {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        notes: document.getElementById('notes').value,
      },
    };

    // Hide form, show success
    Object.values(elements.steps).forEach(step => step.classList.add('sb-step-hidden'));
    elements.summary.style.display = 'none';
    elements.btnNext.style.display = 'none';
    elements.btnBack.style.display = 'none';
    elements.success.classList.remove('sb-step-hidden');

    // Send message to parent (for iframe embed)
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'BOOKING_SUBMITTED',
        data: bookingData,
      }, '*');
    }

    console.log('Booking submitted:', bookingData);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
