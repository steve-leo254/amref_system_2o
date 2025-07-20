
document.addEventListener('DOMContentLoaded', function () {
  // --- DOM Element References ---
  const form = document.getElementById('appointmentForm');
  const patientName = document.getElementById('patientName');
  const patientEmail = document.getElementById('patientEmail');
  const patientPhone = document.getElementById('patientPhone');
  const specializationSelect = document.getElementById('specialization');
  const hospitalSelect = document.getElementById('hospital');
  const doctorSelect = document.getElementById('doctor');
  const doctorTick = document.getElementById('doctorTick');
  const doctorErrorDiv = document.getElementById('doctorError');
  const appointmentReason = document.getElementById('appointmentReason');

  // Calendar Elements (Assuming your calendar logic interacts with these)
  const calWrap = document.getElementById('calWrap');
  const selectedDateInput = document.getElementById('selectedDate'); // Hidden input
  const customDateDisplay = document.getElementById('customDate');   // Readonly display input
  const dateErrorDiv = document.getElementById('dateError');
  const calendarLoading = document.getElementById('calendarLoading');

  // Time Elements
  const timeSelect = document.getElementById('timeSelect');
  const customTimeInput = document.getElementById('customTime');
  const timeSlotErrorDiv = document.getElementById('timeSlotError');

  // Status Message Area
  const formStatusDiv = document.getElementById('formStatus');
  const checkoutButton = document.getElementById('checkoutButton');

  // --- Mock Data (Replace with actual fetching if needed) ---
  // Always show these doctors
  const doctorsList = [
    { value: "lovette", name: "Lovette Kananu" },
    { value: "steve", name: "Steve Leo" },
    { value: "stella", name: "Stella Kanini" }
  ];

  // --- Calendar Initialization (Dynamic Month Grid) ---
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  function renderCalendar() {
    const today = new Date();
    const selectedDoctor = doctorSelect.value;
    calWrap.innerHTML = '';
    calendarLoading.textContent = '';

    // Header
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const header = document.createElement('div');
    header.className = 'text-center mb-2 fw-bold';
    header.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calWrap.appendChild(header);

    // Day names
    const daysRow = document.createElement('div');
    daysRow.className = 'd-flex justify-content-between mb-1';
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
      const d = document.createElement('div');
      d.className = 'text-muted small';
      d.style.width = '2.2em';
      d.textContent = day;
      daysRow.appendChild(d);
    });
    calWrap.appendChild(daysRow);

    // Dates grid
    const grid = document.createElement('div');
    grid.className = 'd-flex flex-wrap';
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const numDays = daysInMonth(currentMonth, currentYear);
    // Leading blanks
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement('button');
      blank.className = 'btn btn-light m-1 calendar-day disabled';
      blank.disabled = true;
      blank.style.width = '2.2em';
      blank.style.height = '2.2em';
      grid.appendChild(blank);
    }
    // Days
    for (let d = 1; d <= numDays; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dateStr = dateObj.toISOString().slice(0, 10);
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-primary m-1 calendar-day';
      btn.textContent = d;
      btn.setAttribute('data-date', dateStr);
      btn.style.width = '2.2em';
      btn.style.height = '2.2em';
      // Disable past dates
      if (dateObj < today.setHours(0,0,0,0)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      }
      // Remove logic that disables days based on doctor/times
      // Highlight selected
      if (selectedDateInput.value === dateStr) {
        btn.classList.add('selected', 'btn-success');
        btn.classList.remove('btn-outline-primary');
      }
      grid.appendChild(btn);
    }
    calWrap.appendChild(grid);
  }

  // Calendar navigation
  document.getElementById('calBack').onclick = function() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    renderCalendar();
  };
  document.getElementById('calNext').onclick = function() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    renderCalendar();
  };

  // Calendar day click
  calWrap.addEventListener('click', (event) => {
    if (event.target.classList.contains('calendar-day') && !event.target.classList.contains('disabled')) {
      const selectedDate = event.target.getAttribute('data-date');
      selectedDateInput.value = selectedDate;
      customDateDisplay.value = selectedDate;
      customDateDisplay.classList.remove('is-invalid');
      selectedDateInput.classList.remove('is-invalid');
      dateErrorDiv.style.display = 'none';
      // Deselect others
      calWrap.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected', 'btn-success'));
      calWrap.querySelectorAll('.calendar-day:not(.disabled)').forEach(el => el.classList.replace('btn-primary', 'btn-outline-primary'));
      event.target.classList.add('selected', 'btn-success');
      event.target.classList.remove('btn-outline-primary');
      updateAvailableTimes();
    }
  });

  // Re-render calendar when doctor changes
  doctorSelect.addEventListener('change', renderCalendar);

  // Initial render
  renderCalendar();

  // --- Helper Functions ---

  function populateDoctors() {
    doctorSelect.innerHTML = '<option value="" selected disabled>-- Select Doctor --</option>';
    resetDoctorSelectionVisuals();
    doctorsList.forEach(doc => {
      const option = document.createElement('option');
      option.value = doc.value;
      option.textContent = doc.name;
      doctorSelect.appendChild(option);
    });
    doctorSelect.disabled = false;
    resetTimeSelection();
  }

  function resetDoctorSelectionVisuals() {
    doctorTick.style.display = 'none';
    doctorSelect.classList.remove('is-valid', 'is-invalid');
    if (doctorErrorDiv) doctorErrorDiv.textContent = 'Please select a doctor.'; // Reset default message
  }

  function updateAvailableTimes() {
    resetTimeSelection();
    // Always show 08:00 to 18:00 (every hour)
    for (let hour = 8; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const option = document.createElement('option');
      option.value = time;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      option.textContent = `${String(displayHour).padStart(2, '0')}:00 ${ampm}`;
      timeSelect.appendChild(option);
    }
    timeSelect.disabled = false;
    customTimeInput.disabled = false;
    timeSlotErrorDiv.style.display = 'none';
  }

  function resetTimeSelection() {
    timeSelect.innerHTML = '<option value="" selected disabled>-- Choose Time --</option>';
    timeSelect.value = ""; // Ensure value is reset
    customTimeInput.value = ""; // Clear custom time too
    timeSelect.classList.remove('is-invalid', 'is-valid');
    customTimeInput.classList.remove('is-invalid', 'is-valid');
    timeSlotErrorDiv.style.display = 'none'; // Hide error on reset
    timeSelect.disabled = true;
    customTimeInput.disabled = true;
  }


  // --- Event Listeners ---

  specializationSelect.addEventListener('change', populateDoctors);
  hospitalSelect.addEventListener('change', populateDoctors);

  doctorSelect.addEventListener('change', function () {
    if (this.value && this.value !== "") {
      this.classList.add('is-valid');
      this.classList.remove('is-invalid');
      doctorTick.style.display = 'inline';
      updateAvailableTimes(); // Update times when doctor changes
    } else {
      resetDoctorSelectionVisuals();
      resetTimeSelection(); // Also reset times if doctor is deselected
    }
  });

  // Optional: Clear custom time if dropdown time is selected
  timeSelect.addEventListener('change', function () {
    if (this.value) {
      customTimeInput.value = ''; // Clear the other input
      // Mark as valid (optional, Bootstrap handles required)
      timeSelect.classList.add('is-valid');
      timeSelect.classList.remove('is-invalid');
      customTimeInput.classList.remove('is-invalid', 'is-valid');
      timeSlotErrorDiv.style.display = 'none'; // Hide error
    }
  });

  // Optional: Clear dropdown time if custom time is entered
  customTimeInput.addEventListener('input', function () {
    if (this.value) {
      timeSelect.value = ''; // Clear the other input
      // Mark as valid (optional, Bootstrap handles required)
      customTimeInput.classList.add('is-valid');
      customTimeInput.classList.remove('is-invalid');
      timeSelect.classList.remove('is-invalid', 'is-valid');
      timeSlotErrorDiv.style.display = 'none'; // Hide error
    }
  });

  // --- Form Submission Handler ---
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default submission ALWAYS first
    event.stopPropagation(); // Stop propagation

    // --- Reset ---
    formStatusDiv.textContent = ''; // Clear general status message
    formStatusDiv.className = '';   // Clear status styles
    // Remove was-validated to reset styles before re-validating
    form.classList.remove('was-validated');
    // Reset custom validation states
    customDateDisplay.classList.remove('is-invalid');
    selectedDateInput.classList.remove('is-invalid');
    dateErrorDiv.style.display = 'none';
    timeSelect.classList.remove('is-invalid');
    customTimeInput.classList.remove('is-invalid');
    timeSlotErrorDiv.style.display = 'none';


    // --- Custom Validation ---
    let isCustomValid = true;

    // 1. Date Validation (Check the hidden input)
    if (!selectedDateInput.value) {
      isCustomValid = false;
      selectedDateInput.classList.add('is-invalid'); // Mark hidden input
      customDateDisplay.classList.add('is-invalid'); // Mark visible display
      dateErrorDiv.style.display = 'block'; // Show error message
    } else {
      selectedDateInput.classList.remove('is-invalid');
      customDateDisplay.classList.remove('is-invalid');
      dateErrorDiv.style.display = 'none';
    }

    // 2. Time Validation (At least one must be selected/filled)
    if (!timeSelect.value && !customTimeInput.value) {
      isCustomValid = false;
      // Mark both as invalid visually for clarity, though only one needed technically
      timeSelect.classList.add('is-invalid');
      customTimeInput.classList.add('is-invalid');
      timeSlotErrorDiv.style.display = 'block'; // Show error message
    } else {
      // If one is filled, remove potential errors from both
      timeSelect.classList.remove('is-invalid');
      customTimeInput.classList.remove('is-invalid');
      timeSlotErrorDiv.style.display = 'none';
    }

    // --- Bootstrap Validation & Final Check ---
    const isBootstrapValid = form.checkValidity(); // Check standard HTML5/Bootstrap validation

    // Apply Bootstrap's styling class AFTER checks
    form.classList.add('was-validated');

    // --- Outcome ---
    if (isBootstrapValid && isCustomValid) {
      // SUCCESS
      console.log('Form is valid. Submitting data (simulated)...');
      formStatusDiv.textContent = 'Appointment details valid. Redirecting to checkout...';
      formStatusDiv.className = 'alert alert-success';

      // Collect form data (Example)
      const formData = {
        patientName: patientName.value,
        patientEmail: patientEmail.value,
        patientPhone: patientPhone.value,
        specialization: specializationSelect.value,
        hospital: hospitalSelect.value,
        doctor: doctorSelect.value,
        doctorName: doctorSelect.options[doctorSelect.selectedIndex]?.text, // Get doctor name
        reason: appointmentReason.value,
        date: selectedDateInput.value,
        time: timeSelect.value || customTimeInput.value // Get selected time
      };
      console.log("Form Data:", formData);
      // Store in localStorage for checkout page
      localStorage.setItem('pendingAppointment', JSON.stringify(formData));

      // Disable button to prevent double submission
      checkoutButton.disabled = true;
      checkoutButton.textContent = 'Processing...';

      // ** REDIRECT TO CHECKOUT **
      // Use setTimeout to allow user to see success message briefly
      setTimeout(() => {
        window.location.href = './checkout.html'; // The actual redirection
      }, 1500); // Redirect after 1.5 seconds

    } else {
      // FAILURE
      console.log('Form is invalid.');
      formStatusDiv.textContent = 'Please review the form and correct the highlighted errors.';
      formStatusDiv.className = 'alert alert-danger';

      // Find the first invalid field (including custom ones) and focus it
      const firstInvalidElement = form.querySelector('.is-invalid, :invalid');
      if (firstInvalidElement) {
        // If it's the hidden date input, focus the display input instead
        if (firstInvalidElement.id === 'selectedDate') {
          customDateDisplay.focus();
        } else {
          firstInvalidElement.focus();
        }
      }
    }
  });

}); // End DOMContentLoaded