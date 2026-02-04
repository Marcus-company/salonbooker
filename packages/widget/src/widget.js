/**
 * SalonBooker Widget
 * Embeddable booking widget for HairsalonX with Supabase integration
 */

(function() {
  'use strict';

  // Supabase Configuration - Will be set via config or env
  const SUPABASE_URL = window.SALONBOOKER_CONFIG?.supabaseUrl || '';
  const SUPABASE_KEY = window.SALONBOOKER_CONFIG?.supabaseKey || '';
  const SALON_ID = window.SALONBOOKER_CONFIG?.salonId || 'hairsalonx';

  let supabase = null;
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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

  // DOM Elements
  const elements = {
    loading: document.getElementById('loading'),
    steps: {
      1: document.getElementById('step-1'),
      2: document.getElementById('step-2'),
      3: document.getElementById('step-3'),
    },
    summary: document.getElementById('summary'),
    success: document.getElementById('success'),
    actions: document.getElementById('actions'),
    servicesList: document.getElementById('services-list'),
    timeSlots: document.getElementById('time-slots'),
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
  async function init() {
    showLoading(true);
    
    // Load initial data
    await Promise.all([
      fetchServices(),
      fetchStaff(),
    ]);
    
    renderCalendar(new Date());
    bindEvents();
    showStep(1);
    showLoading(false);
  }

  // Show/hide loading
  function showLoading(show) {
    elements.loading.style.display = show ? 'flex' : 'none';
  }

  // Fetch services from Supabase
  async function fetchServices() {
    if (!supabase) {
      // Fallback to default services
      services = getDefaultServices();
      renderServices();
      return;
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      services = getDefaultServices();
    } else {
      services = data || getDefaultServices();
    }
    
    renderServices();
  }

  // Fetch staff from Supabase
  async function fetchStaff() {
    if (!supabase) {
      staff = [];
      return;
    }

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching staff:', error);
      staff = [];
    } else {
      staff = data || [];
    }
  }

  // Default services fallback
  function getDefaultServices() {
    return [
      { id: '1', name: 'Knippen dames', duration: '45 min', price: 35, icon: '✂️' },
      { id: '2', name: 'Knippen heren', duration: '30 min', price: 25, icon: '✂️' },
      { id: '3', name: 'Knippen kinderen', duration: '30 min', price: 18, icon: '✂️' },
      { id: '4', name: 'Full color', duration: '90 min', price: 55, icon: '🎨' },
      { id: '5', name: 'Highlights', duration: '120 min', price: 65, icon: '🎨' },
      { id: '6', name: 'Balayage', duration: '150 min', price: 85, icon: '🎨' },
    ];
  }

  // Render services
  function renderServices() {
    elements.servicesList.innerHTML = services.map(service => `
      <button class="sb-service-card" data-service-id="${service.id}" data-duration="${service.duration}" data-price="${service.price}">
        <span class="sb-service-icon">${service.icon || '✂️'}</span>
        <div class="sb-service-info">
          <span class="sb-service-name">${service.name}</span>
          <span class="sb-service-meta">${service.duration} • €${service.price}</span>
        </div>
      </button>
    `).join('');

    // Re-bind events
    document.querySelectorAll('.sb-service-card').forEach(card => {
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
  }

  // Service Selection
  function selectService(card) {
    document.querySelectorAll('.sb-service-card').forEach(c => {
      c.classList.remove('sb-service-selected');
    });
    card.classList.add('sb-service-selected');

    const serviceId = card.dataset.serviceId;
    selectedService = services.find(s => s.id === serviceId) || {
      id: serviceId,
      name: card.querySelector('.sb-service-name').textContent,
      price: parseInt(card.dataset.price),
      duration: card.dataset.duration,
    };

    updateSummary();
  }

  // Time Selection
  function selectTime(slot, time) {
    document.querySelectorAll('.sb-time-slot').forEach(s => {
      s.classList.remove('sb-time-slot-selected');
    });
    slot.classList.add('sb-time-slot-selected');
    selectedTime = time;
    updateSummary();
  }

  // Fetch available time slots from Supabase
  async function fetchAvailableSlots(date) {
    if (!supabase || !selectedService) {
      // Fallback to default time slots
      return getDefaultTimeSlots(date);
    }

    const dateStr = date.toISOString().split('T')[0];
    
    // Fetch existing bookings for this date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('booking_date', dateStr)
      .in('status', ['confirmed', 'pending']);

    if (error) {
      console.error('Error fetching bookings:', error);
      return getDefaultTimeSlots(date);
    }

    const bookedTimes = bookings?.map(b => b.booking_time) || [];
    const allSlots = generateTimeSlots(date.getDay());
    
    // Filter out booked times
    return allSlots.map(time => ({
      time,
      available: !bookedTimes.includes(time),
    }));
  }

  // Generate default time slots based on day
  function getDefaultTimeSlots(date) {
    const slots = generateTimeSlots(date.getDay());
    return slots.map(time => ({
      time,
      available: Math.random() > 0.3, // Simulate some unavailable slots
    }));
  }

  // Generate time slots based on opening hours
  function generateTimeSlots(dayOfWeek) {
    // Sunday = 0, Monday = 1
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      return []; // Closed on Sunday and Monday
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
    elements.timeSlots.innerHTML = '<div class="sb-spinner"></div>';
    
    const slots = await fetchAvailableSlots(date);
    
    elements.timeSlots.innerHTML = slots.map(slot => `
      <button class="sb-time-slot ${slot.available ? '' : 'sb-time-slot-busy'}" 
              data-time="${slot.time}" 
              ${slot.available ? '' : 'disabled'}>
        ${slot.time}
      </button>
    `).join('');

    // Re-bind events
    document.querySelectorAll('.sb-time-slot:not(.sb-time-slot-busy)').forEach(slot => {
      slot.addEventListener('click', () => selectTime(slot, slot.dataset.time));
    });
  }

  // Calendar Rendering
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
        dayEl.title = 'Gesloten';
      }

      dayEl.addEventListener('click', () => selectDate(dayEl, currentDate, dateStr));
      elements.calendarGrid.appendChild(dayEl);
    }
  }

  function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar(currentCalendarDate);
    
    // Clear selected date when changing month
    selectedDate = null;
    selectedTime = null;
    elements.timeSlots.innerHTML = '<p class="sb-hint">Selecteer eerst een datum</p>';
    updateSummary();
  }

  async function selectDate(dayEl, date, dateStr) {
    document.querySelectorAll('.sb-calendar-day').forEach(d => {
      d.classList.remove('sb-day-selected');
    });
    dayEl.classList.add('sb-day-selected');
    
    selectedDate = date.toLocaleDateString('nl-NL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
    
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

    // Show/hide summary and actions
    const showSummary = currentStep > 1;
    elements.summary.style.display = showSummary ? 'block' : 'none';
    elements.actions.style.display = 'flex';
    elements.success.classList.add('sb-step-hidden');
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
        if (!selectedDate || !selectedTime) {
          showError('Selecteer een datum en tijd');
          return false;
        }
        return true;
      case 3:
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        if (!name || !phone) {
          showError('Vul je naam en telefoonnummer in');
          return false;
        }
        return true;
    }
    return true;
  }

  function showError(message) {
    // Simple alert for now - could be a nice toast notification
    alert(message);
  }

  function updateSummary() {
    elements.summaryService.textContent = selectedService?.name || '-';
    elements.summaryDate.textContent = selectedDate || '-';
    elements.summaryTime.textContent = selectedTime || '-';
    elements.summaryPrice.textContent = selectedService ? `€${selectedService.price}` : '-';
  }

  async function submitBooking() {
    const bookingData = {
      salon_id: SALON_ID,
      service_id: selectedService?.id,
      service_name: selectedService?.name,
      service_duration: selectedService?.duration,
      service_price: selectedService?.price,
      booking_date: formatDateForDB(selectedDate),
      booking_time: selectedTime,
      customer_name: document.getElementById('name').value.trim(),
      customer_phone: document.getElementById('phone').value.trim(),
      customer_email: document.getElementById('email').value.trim() || null,
      notes: document.getElementById('notes').value.trim() || null,
      status: 'pending',
    };

    showLoading(true);

    try {
      let result;
      
      if (supabase) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select();

        if (error) throw error;
        result = data;
      } else {
        // Fallback: simulate API call
        console.log('No Supabase config, simulating booking:', bookingData);
        await new Promise(r => setTimeout(r, 1000));
        result = { id: 'mock-' + Date.now() };
      }

      // Hide form, show success
      Object.values(elements.steps).forEach(step => step.classList.add('sb-step-hidden'));
      elements.summary.style.display = 'none';
      elements.actions.style.display = 'none';
      elements.success.classList.remove('sb-step-hidden');

      // Send message to parent (for iframe embed)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'BOOKING_SUBMITTED',
          data: { ...bookingData, id: result?.[0]?.id || result.id },
        }, '*');
      }

    } catch (error) {
      console.error('Booking error:', error);
      showError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      showLoading(false);
    }
  }

  function formatDateForDB(dateStr) {
    if (!dateStr) return null;
    // Parse Dutch date format and convert to ISO
    const parts = dateStr.split(' ');
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const monthIndex = months.findIndex(m => parts[2]?.toLowerCase().startsWith(m));
    if (monthIndex === -1) return null;
    
    const year = currentCalendarDate.getFullYear();
    const month = String(monthIndex + 1).padStart(2, '0');
    const day = String(parseInt(parts[1])).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
