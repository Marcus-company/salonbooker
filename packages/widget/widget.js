/**
 * SalonBooker Widget v1.1.0
 * Embeddable booking widget for HairsalonX with Supabase integration
 * 
 * Fixes in v1.1.0:
 * - Fixed date parsing bug in formatDateForDB
 * - Fixed timezone issues with toISOString()
 * - Added proper input validation
 * - Added error handling for network failures
 * - Added max booking date limit (90 days)
 * - Added confirmation dialog
 * - Added accessibility improvements
 * - Added loading states per section
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    maxBookingDays: 90, // Max 90 days in advance
    minBookingHours: 2, // Min 2 hours notice
    retryAttempts: 3,
    retryDelay: 1000,
  };

  // Supabase Configuration - Will be set via config or env
  const SUPABASE_URL = window.SALONBOOKER_CONFIG?.supabaseUrl || '';
  const SUPABASE_KEY = window.SALONBOOKER_CONFIG?.supabaseKey || '';
  const SALON_ID = window.SALONBOOKER_CONFIG?.salonId || 'hairsalonx';

  let supabase = null;
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
      console.error('Failed to initialize Supabase:', e);
    }
  }

  // State
  let currentStep = 1;
  const totalSteps = 3;
  let selectedService = null;
  let selectedDate = null;
  let selectedTime = null;
  let selectedStaff = null;
  let services = [];
  let staff = [];
  let availableSlots = [];
  let currentCalendarDate = new Date();
  let isSubmitting = false;

  // DOM Elements Cache
  const elements = {};

  // Utility Functions
  const utils = {
    // Format date to YYYY-MM-DD for database (local timezone)
    formatDateForDB: (date) => {
      if (!date || !(date instanceof Date)) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // Format date for display (Dutch)
    formatDateForDisplay: (date) => {
      if (!date || !(date instanceof Date)) return '-';
      return date.toLocaleDateString('nl-NL', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    },

    // Parse display date back to Date object
    parseDisplayDate: (dateStr, referenceDate) => {
      if (!dateStr || !referenceDate) return null;
      const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
      const parts = dateStr.split(' ');
      if (parts.length < 3) return null;
      
      const monthIndex = months.findIndex(m => parts[2]?.toLowerCase().startsWith(m));
      if (monthIndex === -1) return null;
      
      const day = parseInt(parts[1]);
      const year = referenceDate.getFullYear();
      
      // Handle year boundary
      const parsedDate = new Date(year, monthIndex, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // If the date is in the past, it might be next year
      if (parsedDate < today && monthIndex < today.getMonth()) {
        parsedDate.setFullYear(year + 1);
      }
      
      return parsedDate;
    },

    // Validate email format
    isValidEmail: (email) => {
      if (!email) return true; // Optional field
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    // Validate phone format (Dutch)
    isValidPhone: (phone) => {
      if (!phone) return false;
      // Remove common formatting characters
      const clean = phone.replace(/[\s\-\(\)\+]/g, '');
      // Dutch numbers: start with 06 (mobile) or 0 + area code (landline)
      // Or international format starting with 31
      return /^((0[1-9][0-9]{8})|(31[0-9]{9})|(06[0-9]{8}))$/.test(clean);
    },

    // Sanitize input
    sanitize: (str) => {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    // Debounce function
    debounce: (fn, ms) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
      };
    },

    // Retry async operation
    retry: async (fn, attempts = CONFIG.retryAttempts) => {
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (err) {
          if (i === attempts - 1) throw err;
          await new Promise(r => setTimeout(r, CONFIG.retryDelay * (i + 1)));
        }
      }
    },

    // Check if date is bookable
    isDateBookable: (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + CONFIG.maxBookingDays);
      
      return date >= today && date <= maxDate;
    },

    // Get month name in Dutch
    getMonthName: (monthIndex) => {
      const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
                     'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
      return months[monthIndex];
    },
  };

  // Cache DOM elements
  function cacheElements() {
    elements.loading = document.getElementById('loading');
    elements.steps = {
      1: document.getElementById('step-1'),
      2: document.getElementById('step-2'),
      3: document.getElementById('step-3'),
    };
    elements.summary = document.getElementById('summary');
    elements.success = document.getElementById('success');
    elements.actions = document.getElementById('actions');
    elements.servicesList = document.getElementById('services-list');
    elements.timeSlots = document.getElementById('time-slots');
    elements.timeSlotsCount = document.getElementById('time-slots-count');
    elements.btnNext = document.getElementById('btn-next');
    elements.btnBack = document.getElementById('btn-back');
    elements.calendarGrid = document.getElementById('calendar-grid');
    elements.currentMonth = document.getElementById('current-month');
    elements.prevMonth = document.getElementById('prev-month');
    elements.nextMonth = document.getElementById('next-month');
    elements.summaryService = document.getElementById('summary-service');
    elements.summaryDate = document.getElementById('summary-date');
    elements.summaryTime = document.getElementById('summary-time');
    elements.summaryPrice = document.getElementById('summary-price');
    elements.errorToast = document.getElementById('error-toast');
    elements.confirmDialog = document.getElementById('confirm-dialog');
    elements.btnConfirm = document.getElementById('btn-confirm');
    elements.btnCancel = document.getElementById('btn-cancel');
    elements.bookingId = document.getElementById('booking-id');
    elements.bookingIdValue = document.getElementById('booking-id-value');
    
    // Form fields
    elements.form = {
      name: document.getElementById('name'),
      phone: document.getElementById('phone'),
      email: document.getElementById('email'),
      notes: document.getElementById('notes'),
    };
  }

  // Initialize
  async function init() {
    cacheElements();
    showLoading(true);
    
    try {
      // Load initial data with retry
      await Promise.all([
        utils.retry(fetchServices),
        utils.retry(fetchStaff),
      ]);
      
      renderCalendar(new Date());
      bindEvents();
      showStep(1);
    } catch (error) {
      console.error('Initialization error:', error);
      showError('Er is een probleem met het laden. Vernieuw de pagina om opnieuw te proberen.');
    } finally {
      showLoading(false);
    }
  }

  // Show/hide loading overlay
  function showLoading(show) {
    elements.loading.classList.toggle('sb-step-hidden', !show);
    if (show) {
      elements.loading.setAttribute('aria-busy', 'true');
    } else {
      elements.loading.setAttribute('aria-busy', 'false');
    }
  }

  // Show error toast
  function showError(message, duration = 4000) {
    const toast = elements.errorToast;
    toast.textContent = message;
    toast.classList.add('sb-visible');
    
    setTimeout(() => {
      toast.classList.remove('sb-visible');
    }, duration);
  }

  // Fetch services from Supabase
  async function fetchServices() {
    if (!supabase) {
      services = getDefaultServices();
      renderServices();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      services = data?.length > 0 ? data : getDefaultServices();
    } catch (err) {
      console.error('Error fetching services:', err);
      services = getDefaultServices();
    }
    
    renderServices();
  }

  // Fetch staff from Supabase
  async function fetchStaff() {
    if (!supabase) {
      staff = [];
      return;
    }

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      staff = data || [];
    } catch (err) {
      console.error('Error fetching staff:', err);
      staff = [];
    }
  }

  // Default services fallback
  function getDefaultServices() {
    return [
      { id: '1', name: 'Knippen dames', duration: 45, price: 35, icon: '✂️', description: 'Inclusief wassen' },
      { id: '2', name: 'Knippen heren', duration: 30, price: 25, icon: '✂️', description: 'Inclusief wassen' },
      { id: '3', name: 'Knippen kinderen', duration: 30, price: 18, icon: '✂️', description: 'Tot 12 jaar' },
      { id: '4', name: 'Full color', duration: 90, price: 55, icon: '🎨', description: 'Inclusief knippen' },
      { id: '5', name: 'Highlights', duration: 120, price: 65, icon: '🎨', description: 'Gedeeltelijk' },
      { id: '6', name: 'Balayage', duration: 150, price: 85, icon: '🎨', description: 'Inclusief knippen' },
      { id: '7', name: 'Föhnen', duration: 30, price: 20, icon: '💨', description: 'Stijl of krul' },
      { id: '8', name: 'Trimmen baard', duration: 15, price: 12, icon: '🧔', description: 'Inclusief verzorging' },
    ];
  }

  // Render services
  function renderServices() {
    if (!services.length) {
      elements.servicesList.innerHTML = '<div class="sb-time-hint">Geen behandelingen beschikbaar</div>';
      return;
    }

    elements.servicesList.innerHTML = services.map(service => `
      <button 
        class="sb-service-card" 
        data-service-id="${utils.sanitize(service.id)}" 
        data-duration="${service.duration}"
        data-price="${service.price}"
        role="radio"
        aria-checked="false"
        type="button"
      >
        <span class="sb-service-icon">${service.icon || '✂️'}</span>
        <div class="sb-service-info">
          <span class="sb-service-name">${utils.sanitize(service.name)}</span>
          <span class="sb-service-meta">${service.duration} min • €${service.price}${service.description ? ' • ' + utils.sanitize(service.description) : ''}</span>
        </div>
      </button>
    `).join('');

    // Bind service selection events
    elements.servicesList.querySelectorAll('.sb-service-card').forEach(card => {
      card.addEventListener('click', () => selectService(card));
    });
  }

  // Event Bindings
  function bindEvents() {
    // Navigation
    elements.btnNext.addEventListener('click', nextStep);
    elements.btnBack.addEventListener('click', prevStep);

    // Calendar navigation
    elements.prevMonth.addEventListener('click', () => changeMonth(-1));
    elements.nextMonth.addEventListener('click', () => changeMonth(1));

    // Confirmation dialog
    elements.btnConfirm.addEventListener('click', () => {
      hideConfirmDialog();
      doSubmitBooking();
    });
    elements.btnCancel.addEventListener('click', hideConfirmDialog);
    elements.confirmDialog.addEventListener('click', (e) => {
      if (e.target === elements.confirmDialog) hideConfirmDialog();
    });

    // Form validation on input
    elements.form.name.addEventListener('blur', validateName);
    elements.form.phone.addEventListener('blur', validatePhone);
    elements.form.email.addEventListener('blur', validateEmail);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.confirmDialog.classList.contains('sb-visible')) {
        if (currentStep > 1) prevStep();
      }
    });
  }

  // Validation functions
  function validateName() {
    const name = elements.form.name.value.trim();
    const isValid = name.length >= 2;
    toggleFieldValidity(elements.form.name, isValid);
    return isValid;
  }

  function validatePhone() {
    const phone = elements.form.phone.value.trim();
    const isValid = utils.isValidPhone(phone);
    toggleFieldValidity(elements.form.phone, isValid);
    return isValid;
  }

  function validateEmail() {
    const email = elements.form.email.value.trim();
    const isValid = utils.isValidEmail(email);
    toggleFieldValidity(elements.form.email, isValid);
    return isValid;
  }

  function toggleFieldValidity(field, isValid) {
    field.classList.remove('sb-input-error', 'sb-input-valid');
    if (field.value) {
      field.classList.add(isValid ? 'sb-input-valid' : 'sb-input-error');
    }
  }

  // Service Selection
  function selectService(card) {
    // Clear previous selection
    elements.servicesList.querySelectorAll('.sb-service-card').forEach(c => {
      c.classList.remove('sb-service-selected');
      c.setAttribute('aria-checked', 'false');
    });
    
    // Set new selection
    card.classList.add('sb-service-selected');
    card.setAttribute('aria-checked', 'true');

    const serviceId = card.dataset.serviceId;
    selectedService = services.find(s => String(s.id) === String(serviceId));

    updateSummary();
  }

  // Time Selection
  function selectTime(slot, time) {
    elements.timeSlots.querySelectorAll('.sb-time-slot').forEach(s => {
      s.classList.remove('sb-time-slot-selected');
      s.setAttribute('aria-checked', 'false');
    });
    slot.classList.add('sb-time-slot-selected');
    slot.setAttribute('aria-checked', 'true');
    selectedTime = time;
    updateSummary();
  }

  // Fetch available time slots from Supabase
  async function fetchAvailableSlots(date) {
    const slots = generateTimeSlots(date);
    
    if (!supabase || !selectedService) {
      // Fallback: return all slots as available
      return slots.map(time => ({ time, available: true }));
    }

    const dateStr = utils.formatDateForDB(date);
    
    try {
      // Fetch existing bookings for this date
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time, service_duration')
        .eq('booking_date', dateStr)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;

      const bookedSlots = bookings?.map(b => b.booking_time) || [];
      
      // Mark slots as unavailable if booked
      return slots.map(time => ({
        time,
        available: !bookedSlots.includes(time),
      }));
    } catch (err) {
      console.error('Error fetching availability:', err);
      // Fallback: return all slots
      return slots.map(time => ({ time, available: true }));
    }
  }

  // Generate time slots based on opening hours
  function generateTimeSlots(date) {
    const dayOfWeek = date.getDay();
    
    // Sunday = 0, Monday = 1 - Closed
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      return [];
    }

    const slots = [];
    const startHour = 9;
    const endHour = dayOfWeek === 4 ? 20 : 17; // Thursday until 20:00
    const lunchStart = 12;
    const lunchEnd = 13.5;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeValue = hour + min / 60;
        if (timeValue >= lunchStart && timeValue < lunchEnd) continue;
        
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        // For today, filter out past times
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
          const slotTime = new Date(date);
          slotTime.setHours(hour, min, 0, 0);
          const minBookingTime = new Date(today.getTime() + CONFIG.minBookingHours * 60 * 60 * 1000);
          if (slotTime < minBookingTime) continue;
        }
        
        slots.push(timeStr);
      }
    }
    
    // Saturday shorter hours
    if (dayOfWeek === 6) {
      return slots.filter(time => {
        const hour = parseInt(time.split(':')[0]);
        return hour >= 9 && hour < 16;
      });
    }

    return slots;
  }

  // Render time slots
  async function renderTimeSlots(date) {
    elements.timeSlots.innerHTML = '<div class="sb-time-slots-loading"><div class="sb-spinner"></div></div>';
    
    try {
      const slots = await fetchAvailableSlots(date);
      availableSlots = slots;
      
      const availableCount = slots.filter(s => s.available).length;
      elements.timeSlotsCount.textContent = availableCount > 0 ? `(${availableCount} beschikbaar)` : '';
      
      if (slots.length === 0) {
        elements.timeSlots.innerHTML = '<div class="sb-time-empty">Geen beschikbare tijden voor deze dag</div>';
        return;
      }
      
      elements.timeSlots.innerHTML = slots.map(slot => `
        <button 
          class="sb-time-slot ${slot.available ? '' : 'sb-time-slot-busy'}" 
          data-time="${slot.time}" 
          ${slot.available ? '' : 'disabled'}
          role="radio"
          aria-checked="false"
          type="button"
        >
          ${slot.time}
        </button>
      `).join('');

      // Bind time selection events
      elements.timeSlots.querySelectorAll('.sb-time-slot:not(.sb-time-slot-busy)').forEach(slot => {
        slot.addEventListener('click', () => selectTime(slot, slot.dataset.time));
      });
    } catch (err) {
      console.error('Error rendering time slots:', err);
      elements.timeSlots.innerHTML = '<div class="sb-time-empty">Kon tijden niet laden. Probeer het opnieuw.</div>';
    }
  }

  // Calendar Rendering
  function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Update header
    elements.currentMonth.textContent = `${utils.getMonthName(month)} ${year}`;

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
    today.setHours(0, 0, 0, 0);

    // Max booking date
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + CONFIG.maxBookingDays);

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

      const currentDate = new Date(year, month, day);

      // Disable past dates and dates beyond max booking
      if (currentDate < today || currentDate > maxDate) {
        dayEl.disabled = true;
      }

      // Highlight today
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayEl.classList.add('sb-day-today');
        dayEl.setAttribute('aria-label', `Vandaag ${day}`);
      }

      // Sunday/Monday = closed
      if (currentDate.getDay() === 0 || currentDate.getDay() === 1) {
        dayEl.disabled = true;
        dayEl.title = 'Gesloten';
      }

      dayEl.addEventListener('click', () => selectDate(dayEl, currentDate));
      elements.calendarGrid.appendChild(dayEl);
    }

    // Disable month navigation if at limits
    const minCalendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    elements.prevMonth.disabled = date <= minCalendarDate;
    
    const maxCalendarDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    elements.nextMonth.disabled = date >= maxCalendarDate;
  }

  function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar(currentCalendarDate);
    
    // Clear selected date when changing month
    selectedDate = null;
    selectedTime = null;
    elements.timeSlots.innerHTML = '<div class="sb-time-hint">Selecteer eerst een datum om de beschikbare tijden te zien</div>';
    elements.timeSlotsCount.textContent = '';
    updateSummary();
  }

  async function selectDate(dayEl, date) {
    elements.calendarGrid.querySelectorAll('.sb-calendar-day').forEach(d => {
      d.classList.remove('sb-day-selected');
    });
    dayEl.classList.add('sb-day-selected');
    
    selectedDate = date;
    selectedTime = null; // Reset time when date changes
    
    // Fetch and render time slots for selected date
    await renderTimeSlots(date);
    
    updateSummary();
  }

  // Navigation
  function nextStep() {
    if (!validateStep(currentStep)) return;

    if (currentStep < totalSteps) {
      showStep(currentStep + 1);
    } else {
      showConfirmDialog();
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

    // Show/hide summary and actions
    const showSummary = currentStep > 1;
    elements.summary.style.display = showSummary ? 'block' : 'none';
    elements.summary.classList.toggle('sb-step-hidden', !showSummary);
    elements.actions.style.display = 'flex';
    elements.success.classList.add('sb-step-hidden');

    // Focus management for accessibility
    elements.steps[currentStep].querySelector('h2')?.focus();
  }

  function validateStep(step) {
    switch (step) {
      case 1:
        if (!selectedService) {
          showError('Selecteer eerst een behandeling');
          return false;
        }
        return true;
      case 2:
        if (!selectedDate) {
          showError('Selecteer eerst een datum');
          return false;
        }
        if (!selectedTime) {
          showError('Selecteer een tijdslot');
          return false;
        }
        return true;
      case 3:
        const nameValid = validateName();
        const phoneValid = validatePhone();
        const emailValid = validateEmail();
        
        if (!nameValid) {
          showError('Vul een geldige naam in (minimaal 2 tekens)');
          elements.form.name.focus();
          return false;
        }
        if (!phoneValid) {
          showError('Vul een geldig telefoonnummer in');
          elements.form.phone.focus();
          return false;
        }
        if (!emailValid) {
          showError('Vul een geldig emailadres in');
          elements.form.email.focus();
          return false;
        }
        return true;
    }
    return true;
  }

  function updateSummary() {
    elements.summaryService.textContent = selectedService?.name || '-';
    elements.summaryDate.textContent = selectedDate ? utils.formatDateForDisplay(selectedDate) : '-';
    elements.summaryTime.textContent = selectedTime || '-';
    elements.summaryPrice.textContent = selectedService ? `€${selectedService.price}` : '-';
  }

  // Confirmation Dialog
  function showConfirmDialog() {
    elements.confirmDialog.classList.add('sb-visible');
    elements.btnConfirm.focus();
  }

  function hideConfirmDialog() {
    elements.confirmDialog.classList.remove('sb-visible');
    elements.btnNext.focus();
  }

  // Submit booking
  async function doSubmitBooking() {
    if (isSubmitting) return;
    isSubmitting = true;

    const bookingData = {
      salon_id: SALON_ID,
      service_id: selectedService?.id,
      service_name: selectedService?.name,
      service_duration: selectedService?.duration,
      service_price: selectedService?.price,
      booking_date: utils.formatDateForDB(selectedDate),
      booking_time: selectedTime,
      customer_name: elements.form.name.value.trim(),
      customer_phone: elements.form.phone.value.trim(),
      customer_email: elements.form.email.value.trim() || null,
      notes: elements.form.notes.value.trim() || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Show loading on button
    const originalBtnText = elements.btnNext.innerHTML;
    elements.btnNext.innerHTML = '<span class="sb-btn-spinner"></span> Bezig...';
    elements.btnNext.disabled = true;
    elements.btnBack.disabled = true;

    try {
      let result;
      
      if (supabase) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select();

        if (error) throw error;
        result = data?.[0];
      } else {
        // Fallback: simulate API call
        console.log('No Supabase config, simulating booking:', bookingData);
        await new Promise(r => setTimeout(r, 1000));
        result = { id: 'DEMO-' + Date.now().toString(36).toUpperCase() };
      }

      // Hide form, show success
      Object.values(elements.steps).forEach(step => step.classList.add('sb-step-hidden'));
      elements.summary.style.display = 'none';
      elements.actions.style.display = 'none';
      elements.success.classList.remove('sb-step-hidden');

      // Show booking ID
      if (result?.id) {
        elements.bookingId.style.display = 'inline-block';
        elements.bookingIdValue.textContent = result.id;
      }

      // Send message to parent (for iframe embed)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'BOOKING_SUBMITTED',
          data: { ...bookingData, id: result?.id },
        }, '*');
      }

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('salonbooker:bookingSubmitted', {
        detail: { ...bookingData, id: result?.id }
      }));

    } catch (error) {
      console.error('Booking error:', error);
      showError('Er is iets misgegaan bij het maken van de afspraak. Probeer het opnieuw.');
      elements.btnNext.innerHTML = originalBtnText;
      elements.btnNext.disabled = false;
      elements.btnBack.disabled = false;
    } finally {
      isSubmitting = false;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for embed script
  window.SalonBookerWidget = {
    version: '1.1.0',
    getState: () => ({
      currentStep,
      selectedService,
      selectedDate,
      selectedTime,
    }),
    reset: () => {
      currentStep = 1;
      selectedService = null;
      selectedDate = null;
      selectedTime = null;
      selectedStaff = null;
      
      // Reset UI
      elements.servicesList.querySelectorAll('.sb-service-card').forEach(c => {
        c.classList.remove('sb-service-selected');
        c.setAttribute('aria-checked', 'false');
      });
      elements.timeSlots.innerHTML = '<div class="sb-time-hint">Selecteer eerst een datum om de beschikbare tijden te zien</div>';
      elements.form.name.value = '';
      elements.form.phone.value = '';
      elements.form.email.value = '';
      elements.form.notes.value = '';
      
      showStep(1);
      updateSummary();
    },
  };
})();
