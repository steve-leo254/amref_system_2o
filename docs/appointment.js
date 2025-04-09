
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
  const doctorsData = {
    "Cardiology": {
      "Nairobi Hospital": [{ value: "cardio1", name: "Dr. James Mwangi" }],
      "Aga Khan University Hospital": [{ value: "cardio2", name: "Dr. Susan Kamau" }],
      "MP Shah Hospital": []
    },
    "Dermatology": {
      "Nairobi Hospital": [],
      "Aga Khan University Hospital": [],
      "MP Shah Hospital": [{ value: "derm1", name: "Dr. Oscar  Ichungwa" }]
    },
    "General Practice": {
      "Nairobi Hospital": [{ value: "gp1", name: "Dr. Genz Musyoks" }],
      "Aga Khan University Hospital": [],
      "MP Shah Hospital": []
    },
    "Pediatrics": {
      "Nairobi Hospital": [{value:"pd1", name:"Dr Farruk Kaongo"}],
      "Aga Khan University Hospital": [],
      "MP Shah Hospital": []
    }
    // Add more specializations and hospitals
  };

  const availableTimes = { // Mock available times (doctor/date specific)
    "cardio1": { "2025-04-10": ["09:00", "11:00"], "2025-04-11": ["14:00"] },
    "cardio2": { "2025-04-10": ["10:00"], "2025-04-12": ["09:00", "10:00", "15:00"] },
    "derm1": { "2025-04-11": ["09:00", "14:00", "15:00", "16:00"] },
    "gp1": { "2025-04-10": ["10:00", "11:00", "12:00"], "2025-04-11": ["16:00", "17:00"] },
  }

  // --- Calendar Initialization (Placeholder) ---
  // ** IMPORTANT: Replace this with your ACTUAL calendar implementation **
  // This basic placeholder just enables the date selection for validation testing
  function initializePlaceholderCalendar() {
    if (calendarLoading) calendarLoading.textContent = 'Please select a date.';
    calWrap.innerHTML = `
          <p class="text-muted small">Calendar Placeholder:</p>
          <button type="button" class="btn btn-outline-primary btn-sm m-1 calendar-day" data-date="2025-04-10">Apr 10</button>
          <button type="button" class="btn btn-outline-primary btn-sm m-1 calendar-day" data-date="2025-04-11">Apr 11</button>
          <button type="button" class="btn btn-outline-primary btn-sm m-1 calendar-day" data-date="2025-04-12">Apr 12</button>
          <button type="button" class="btn btn-outline-secondary btn-sm m-1 calendar-day disabled" data-date="2025-04-13">Apr 13</button>
          `; // Add more dates or full calendar grid

    calWrap.addEventListener('click', (event) => {
      if (event.target.classList.contains('calendar-day') && !event.target.classList.contains('disabled')) {
        const selectedDate = event.target.getAttribute('data-date');

        // Update hidden input (critical for validation)
        selectedDateInput.value = selectedDate;

        // Update display input
        customDateDisplay.value = selectedDate; // Format as needed

        // Remove validation error class if present
        customDateDisplay.classList.remove('is-invalid');
        selectedDateInput.classList.remove('is-invalid'); // Target hidden input state too
        dateErrorDiv.style.display = 'none'; // Hide error message

        // Deselect other days visually (simple example)
        calWrap.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected', 'btn-success'));
        calWrap.querySelectorAll('.calendar-day:not(.disabled)').forEach(el => el.classList.replace('btn-primary', 'btn-outline-primary'));

        // Select current day visually
        event.target.classList.add('selected', 'btn-success');
        event.target.classList.remove('btn-outline-primary');

        // Trigger time slot update
        updateAvailableTimes();
      }
    });
  }
  initializePlaceholderCalendar(); // Call the placeholder calendar setup

  // --- Helper Functions ---

  function populateDoctors() {
    const spec = specializationSelect.value;
    const hosp = hospitalSelect.value;
    doctorSelect.innerHTML = '<option value="" selected disabled>-- Select Doctor --</option>'; // Reset
    resetDoctorSelectionVisuals(); // Clear tick and validation
    doctorSelect.disabled = true; // Disable until valid options load

    if (spec && hosp && doctorsData[spec] && doctorsData[spec][hosp]) {
      const doctors = doctorsData[spec][hosp];
      if (doctors.length > 0) {
        doctors.forEach(doc => {
          const option = document.createElement('option');
          option.value = doc.value;
          option.textContent = doc.name;
          doctorSelect.appendChild(option);
        });
        doctorSelect.disabled = false; // Enable the select
      } else {
        doctorSelect.innerHTML = '<option value="" selected disabled>-- No Doctors Available --</option>';
      }
    } else {
      doctorSelect.innerHTML = '<option value="" selected disabled>-- Select Specialization/Hospital First --</option>';
    }
    // Also reset time slots when doctor list changes
    resetTimeSelection();
  }

  function resetDoctorSelectionVisuals() {
    doctorTick.style.display = 'none';
    doctorSelect.classList.remove('is-valid', 'is-invalid');
    if (doctorErrorDiv) doctorErrorDiv.textContent = 'Please select a doctor.'; // Reset default message
  }

  function updateAvailableTimes() {
    const doctorId = doctorSelect.value;
    const date = selectedDateInput.value;
    resetTimeSelection(); // Clear previous times and errors

    if (doctorId && date && availableTimes[doctorId] && availableTimes[doctorId][date]) {
      const times = availableTimes[doctorId][date];
      if (times.length > 0) {
        times.forEach(time => {
          const option = document.createElement('option');
          option.value = time;
          // Format time for display (e.g., 09:00 -> 09:00 AM)
          const hour = parseInt(time.split(':')[0], 10);
          const minute = time.split(':')[1];
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 === 0 ? 12 : hour % 12;
          option.textContent = `${String(displayHour).padStart(2, '0')}:${minute} ${ampm}`;
          timeSelect.appendChild(option);
        });
        timeSelect.disabled = false;
        customTimeInput.disabled = false;
        timeSlotErrorDiv.style.display = 'none'; // Hide error if times are loaded
      } else {
        timeSelect.innerHTML = '<option value="" selected disabled>-- No Slots Available --</option>';
      }
    } else {
      timeSelect.innerHTML = '<option value="" selected disabled>-- Select Doctor/Date --</option>';
      timeSelect.disabled = true;
      customTimeInput.disabled = true;
    }
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