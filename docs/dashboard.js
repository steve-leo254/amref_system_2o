// --- Dashboard JS migrated from HTML ---

// Application State
const state = {
    healthTips: [
        "Stay hydrated! Drink at least 8 glasses of water daily to maintain optimal health.",
        "Take a 10-minute walk after each meal to improve digestion and blood sugar levels.",
        "Practice deep breathing for 5 minutes daily to reduce stress and improve focus.",
        "Eat a colorful variety of fruits and vegetables to get essential nutrients.",
        "Maintain a consistent sleep schedule for better mental and physical health.",
        "Wash your hands frequently to prevent the spread of germs and infections."
    ],
    currentTipIndex: 0
};

function getConfirmedAppointments() {
    return JSON.parse(localStorage.getItem('confirmedAppointments') || '[]');
}

// DOM Elements
const paymentModal = document.getElementById('paymentModal');
const dashboardContainer = document.getElementById('dashboardContainer');
const appointmentsList = document.getElementById('appointmentsList');
const healthTipText = document.getElementById('healthTipText');

// Initialize Application
window.addEventListener('DOMContentLoaded', function() {
    checkPageSource();
    initializeDashboard();
    startHealthTipRotation();
    updateClock();
    loadWeatherData();
    
    // Add card number formatting
    const cardNumberInput = document.querySelector('input[name="cardNumber"]');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }

    // Add expiry date formatting
    const expiryInput = document.querySelector('input[name="expiry"]');
    if (expiryInput) {
        expiryInput.addEventListener('input', formatExpiryDate);
    }

    // Join Meeting Modal Logic
    let pendingMeetLink = null;
    if (appointmentsList) {
        appointmentsList.addEventListener('click', function(e) {
            const btn = e.target.closest('.join-btn');
            if (btn) {
                e.preventDefault();
                pendingMeetLink = btn.getAttribute('data-meet-link');
                document.getElementById('modal-meet-link').textContent = pendingMeetLink;
                const modal = new bootstrap.Modal(document.getElementById('joinMeetModal'));
                modal.show();
            }
        });
    }
    document.getElementById('confirmJoinMeet').addEventListener('click', function() {
        if (pendingMeetLink) {
            window.open(pendingMeetLink, '_blank');
            const modalEl = document.getElementById('joinMeetModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            pendingMeetLink = null;
        }
    });
});

// Check if coming from appointment page
function checkPageSource() {
    const referrer = document.referrer;
    const fromAppointment = referrer.includes('appointment.html') || 
                          sessionStorage.getItem('showPayment') === 'true';
    
    if (fromAppointment) {
        showPaymentModal();
        sessionStorage.removeItem('showPayment');
    } else {
        showDashboard();
    }
}

// Show payment modal
function showPaymentModal() {
    paymentModal.classList.add('active');
    dashboardContainer.style.display = 'none';
    
    // Add payment form handler
    const paymentForm = document.getElementById('paymentForm');
    paymentForm.addEventListener('submit', handlePaymentSubmission);
}

// Show dashboard
function showDashboard() {
    paymentModal.classList.remove('active');
    dashboardContainer.style.display = 'block';
    document.body.classList.add('dashboard-active');
}

// Handle payment form submission
function handlePaymentSubmission(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<span class="spinner"></span>Processing...';
    submitBtn.disabled = true;
    
    // Simulate payment processing
    setTimeout(() => {
        // Add new appointment
        const newAppointment = {
            id: state.appointments.length + 1,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: "2:00 PM",
            doctor: "Dr. Sarah Johnson",
            status: "upcoming",
            meetLink: "https://demo.videosdk.live/conference-meeting/new-meeting"
        };
        
        state.appointments.push(newAppointment);
        
        // Show success message
        showNotification('Payment successful! Appointment booked.', 'success');
        
        // Reset form and show dashboard
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showDashboard();
        updateAppointmentsDisplay();
        updateStats();
        
    }, 2000);
}

// Initialize dashboard
function initializeDashboard() {
    updateAppointmentsDisplay();
    updateStats();
    
    // Set user name from localStorage login
    const userName = document.getElementById('userName');
    if (userName) {
        const loggedInEmail = localStorage.getItem('loggedInUserEmail');
        let displayName = 'User';
        if (loggedInEmail) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[loggedInEmail] && users[loggedInEmail].Name) {
                displayName = users[loggedInEmail].Name;
            }
        }
        userName.textContent = displayName;
    }
}

// Update appointments display
function updateAppointmentsDisplay() {
    if (!appointmentsList) return;
    appointmentsList.innerHTML = '';
    const confirmedAppointments = getConfirmedAppointments();
    if (confirmedAppointments.length === 0) {
        appointmentsList.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No appointments found. Book your first appointment!</td></tr>';
        return;
    }
    // Sort appointments by date
    const sortedAppointments = [...confirmedAppointments].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );
    sortedAppointments.forEach((appointment, idx) => {
        const row = createAppointmentRow(appointment, idx);
        appointmentsList.appendChild(row);
    });
}

// Create appointment row
function createAppointmentRow(appointment, idx) {
    const row = document.createElement('tr');
    const formattedDate = new Date(appointment.date).toLocaleDateString();
    const statusBadge = getStatusBadge(appointment.status);
    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${appointment.time}</td>
        <td>${appointment.doctor}</td>
        <td>${statusBadge}</td>
        <td>
            ${appointment.status === 'upcoming' 
                ? `<button class="join-btn" data-meet-link="${appointment.meetLink}">
                    <i class="fas fa-video me-1"></i>Join Meeting
                   </button>`
                : appointment.status === 'pending'
                    ? `<span class="text-muted">Pending</span>
                       <button class="btn btn-sm btn-outline-primary ms-2 request-upcoming" data-idx="${idx}">Request Go Live</button>
                       <button class="btn btn-sm btn-outline-danger ms-1 request-cancel" data-idx="${idx}">Cancel</button>`
                    : appointment.status === 'cancelled'
                        ? `<span class="text-danger">Cancelled</span>`
                        : `<span class="text-muted">Completed</span>`
            }
        </td>
    `;
    return row;
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge bg-warning text-dark">Pending</span>',
        upcoming: '<span class="badge bg-primary">Upcoming</span>',
        completed: '<span class="badge bg-success">Completed</span>',
        cancelled: '<span class="badge bg-danger">Cancelled</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

// Update statistics
function updateStats() {
    const totalAppointments = document.getElementById('totalAppointments');
    const upcomingAppointments = document.getElementById('upcomingAppointments');
    const confirmedAppointments = getConfirmedAppointments();
    if (totalAppointments) {
        totalAppointments.textContent = confirmedAppointments.length;
    }
    if (upcomingAppointments) {
        const upcoming = confirmedAppointments.filter(app => app.status === 'upcoming').length;
        upcomingAppointments.textContent = upcoming;
    }
}

// Health tip rotation
function startHealthTipRotation() {
    if (!healthTipText) return;
    function showNextTip() {
        healthTipText.style.opacity = '0';
        setTimeout(() => {
            healthTipText.textContent = state.healthTips[state.currentTipIndex];
            healthTipText.style.opacity = '1';
            state.currentTipIndex = (state.currentTipIndex + 1) % state.healthTips.length;
        }, 300);
    }
    showNextTip();
    setInterval(showNextTip, 8000);
}

// Update clock
function updateClock() {
    const clockElement = document.getElementById('currentTime');
    if (!clockElement) return;
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        clockElement.textContent = timeString;
    }
    updateTime();
    setInterval(updateTime, 1000);
}

// Load weather data (placeholder)
function loadWeatherData() {
    const temperatureElement = document.getElementById('temperature');
    const weatherDescElement = document.getElementById('weatherDesc');
    if (temperatureElement && weatherDescElement) {
        temperatureElement.textContent = '28°';
        weatherDescElement.textContent = 'Sunny';
    }
}

// Placeholder for notifications
function showNotification(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.textContent = message;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.setAttribute('data-bs-dismiss', 'alert');
    alertDiv.setAttribute('aria-label', 'Close');
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Placeholder for formatting card number
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 0) {
        value = value.replace(/\s/g, '');
        const parts = [];
        for (let i = 0; i < value.length; i += 4) {
            parts.push(value.substring(i, i + 4));
        }
        e.target.value = parts.join(' ');
    }
}

// Placeholder for formatting expiry date
function formatExpiryDate(e) {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 0) {
        value = value.replace(/\s/g, '');
        const parts = [];
        for (let i = 0; i < value.length; i += 2) {
            parts.push(value.substring(i, i + 2));
        }
        e.target.value = parts.join('/');
    }
}

// Placeholder for bookAppointment
function bookAppointment() {
    window.location.href = 'appointment.html';
}

// Placeholder for viewPrescriptions
function viewPrescriptions() {
    showNotification('Viewing prescriptions...', 'info');
}

// Placeholder for healthRecords
function healthRecords() {
    showNotification('Viewing health records...', 'info');
}

// Placeholder for findDoctors
function findDoctors() {
    showNotification('Finding doctors...', 'info');
}

// Event delegation for status change buttons
if (appointmentsList) {
    appointmentsList.addEventListener('click', function(e) {
        const idx = e.target.getAttribute('data-idx');
        if (e.target.classList.contains('request-upcoming')) {
            changeUserAppointmentStatus(idx, 'upcoming');
        } else if (e.target.classList.contains('request-cancel')) {
            changeUserAppointmentStatus(idx, 'cancelled');
        }
    });
}

function changeUserAppointmentStatus(idx, newStatus) {
    const appointments = getConfirmedAppointments();
    if (appointments[idx]) {
        appointments[idx].status = newStatus;
        localStorage.setItem('confirmedAppointments', JSON.stringify(appointments));
        updateAppointmentsDisplay();
        updateStats();
        showNotification(`Appointment status changed to ${newStatus}.`, 'info');
    }
}

// Side Menu
addEventListener("resize", () => {
  const width = innerWidth;
  const nav = document.querySelector(".nav");
  const navbar = document.querySelector(".navbar");
  
  if (nav && navbar) {
    if (width < 768) {
      nav.style.display = "none";
      navbar.style.display = "block";
    } else {
      nav.style.display = "flex";
      navbar.style.display = "none";
    }
  }
});

// Side button effect
const button = document.querySelector(".side-cont");
if (button) {
  button.addEventListener("mouseover", function () {
    button.textContent = "Side Menu";
  });

  button.addEventListener("mouseout", function () {
    button.innerHTML = "&#8592;";
  });
}

// Calendar functionality
var cal = {
  sMon: false,
  data: null,
  sDay: 0, sMth: 0, sYear: 0,
  
  months: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],
  days: ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"],
  
  hMth: null, hYear: null,
  hWrap: null,
  hFormWrap: null, hForm: null,
  hfDate: null, hfTxt: null, hfDel: null,

  init: () => {
    // Get DOM elements with error checking
    cal.hMth = document.getElementById("calMonth");
    cal.hYear = document.getElementById("calYear");
    cal.hWrap = document.getElementById("calWrap");
    cal.hFormWrap = document.getElementById("calForm");
    
    // Only initialize if calendar elements exist
    if (!cal.hMth || !cal.hYear || !cal.hWrap) {
      console.log("Calendar elements not found, skipping calendar initialization");
      return;
    }
    
    if (cal.hFormWrap) {
      cal.hForm = cal.hFormWrap.querySelector("form");
      cal.hfDate = document.getElementById("evtDate");
      cal.hfTxt = document.getElementById("evtTxt");
      cal.hfDel = document.getElementById("evtDel");
    }

    let now = new Date(), nowMth = now.getMonth();
    cal.hYear.value = parseInt(now.getFullYear());
    
    for (let i = 0; i < 12; i++) {
      let opt = document.createElement("option");
      opt.value = i;
      opt.innerHTML = cal.months[i];
      if (i == nowMth) { opt.selected = true; }
      cal.hMth.appendChild(opt);
    }

    cal.hMth.onchange = cal.draw;
    cal.hYear.onchange = cal.draw;
    
    const calBack = document.getElementById("calBack");
    const calNext = document.getElementById("calNext");
    const evtClose = document.getElementById("evtClose");
    
    if (calBack) calBack.onclick = () => cal.pshift();
    if (calNext) calNext.onclick = () => cal.pshift(1);
    if (cal.hForm) cal.hForm.onsubmit = cal.save;
    if (evtClose && cal.hFormWrap) evtClose.onclick = () => cal.hFormWrap.close();
    if (cal.hfDel) cal.hfDel.onclick = cal.del;

    if (cal.sMon) { cal.days.push(cal.days.shift()); }
    cal.draw();
  },

  pshift: forward => {
    cal.sMth = parseInt(cal.hMth.value);
    cal.sYear = parseInt(cal.hYear.value);
    if (forward) { cal.sMth++; } else { cal.sMth--; }
    if (cal.sMth > 11) { cal.sMth = 0; cal.sYear++; }
    if (cal.sMth < 0) { cal.sMth = 11; cal.sYear--; }
    cal.hMth.value = cal.sMth;
    cal.hYear.value = cal.sYear;
    cal.draw();
  },

  draw: () => {
    if (!cal.hWrap) return;
    
    cal.sMth = parseInt(cal.hMth.value);
    cal.sYear = parseInt(cal.hYear.value);
    let daysInMth = new Date(cal.sYear, cal.sMth + 1, 0).getDate(),
      startDay = new Date(cal.sYear, cal.sMth, 1).getDay(),
      endDay = new Date(cal.sYear, cal.sMth, daysInMth).getDay(),
      now = new Date(),
      nowMth = now.getMonth(),
      nowYear = parseInt(now.getFullYear()),
      nowDay = cal.sMth == nowMth && cal.sYear == nowYear ? now.getDate() : null;

    // Use in-memory storage instead of localStorage for calendar data
    const storageKey = `cal-${cal.sMth}-${cal.sYear}`;
    if (!window.calendarData) window.calendarData = {};
    
    cal.data = window.calendarData[storageKey] || {};

    let squares = [];
    if (cal.sMon && startDay != 1) {
      let blanks = startDay == 0 ? 7 : startDay;
      for (let i = 1; i < blanks; i++) { squares.push("b"); }
    }
    if (!cal.sMon && startDay != 0) {
      for (let i = 0; i < startDay; i++) { squares.push("b"); }
    }

    for (let i = 1; i <= daysInMth; i++) { squares.push(i); }

    if (cal.sMon && endDay != 0) {
      let blanks = endDay == 6 ? 1 : 7 - endDay;
      for (let i = 0; i < blanks; i++) { squares.push("b"); }
    }
    if (!cal.sMon && endDay != 6) {
      let blanks = endDay == 0 ? 6 : 6 - endDay;
      for (let i = 0; i < blanks; i++) { squares.push("b"); }
    }

    cal.hWrap.innerHTML = `<div class="calHead"></div>
    <div class="calBody">
      <div class="calRow"></div>
    </div>`;

    let wrap = cal.hWrap.querySelector(".calHead");
    for (let d of cal.days) {
      let cell = document.createElement("div");
      cell.className = "calCell";
      cell.innerHTML = d;
      wrap.appendChild(cell);
    }

    wrap = cal.hWrap.querySelector(".calBody");
    let row = cal.hWrap.querySelector(".calRow");
    for (let i = 0; i < squares.length; i++) {
      let cell = document.createElement("div");
      cell.className = "calCell";
      if (nowDay == squares[i]) { cell.classList.add("calToday"); }
      if (squares[i] == "b") { 
        cell.classList.add("calBlank"); 
      } else {
        cell.innerHTML = `<div class="cellDate">${squares[i]}</div>`;
        if (cal.data[squares[i]]) {
          cell.innerHTML += "<div class='evt'>" + cal.data[squares[i]] + "</div>";
        }
        cell.onclick = () => { cal.show(cell); };
      }
      row.appendChild(cell);

      if (i != (squares.length - 1) && i != 0 && (i + 1) % 7 == 0) {
        row = document.createElement("div");
        row.className = "calRow";
        wrap.appendChild(row);
      }
    }
  },
  
  show: cell => {
    if (!cal.hForm || !cal.hFormWrap) return;
    
    cal.hForm.reset();
    cal.sDay = cell.querySelector(".cellDate").innerHTML;
    if (cal.hfDate) cal.hfDate.value = `${cal.sDay} ${cal.months[cal.sMth]} ${cal.sYear}`;
    if (cal.data[cal.sDay] !== undefined) {
      if (cal.hfTxt) cal.hfTxt.value = cal.data[cal.sDay];
      if (cal.hfDel) cal.hfDel.classList.remove("hide");
    } else { 
      if (cal.hfDel) cal.hfDel.classList.add("hide"); 
    }
    cal.hFormWrap.show();
  },

  save: () => {
    if (!cal.hfTxt) return false;
    
    if (!window.calendarData) window.calendarData = {};
    const storageKey = `cal-${cal.sMth}-${cal.sYear}`;
    if (!window.calendarData[storageKey]) window.calendarData[storageKey] = {};
    
    window.calendarData[storageKey][cal.sDay] = cal.hfTxt.value;
    cal.data = window.calendarData[storageKey];
    cal.draw();
    if (cal.hFormWrap) cal.hFormWrap.close();
    return false;
  },
  
  del: () => {
    if (confirm("Delete event?")) {
      if (!window.calendarData) window.calendarData = {};
      const storageKey = `cal-${cal.sMth}-${cal.sYear}`;
      if (window.calendarData[storageKey]) {
        delete window.calendarData[storageKey][cal.sDay];
        cal.data = window.calendarData[storageKey];
      }
      cal.draw();
      if (cal.hFormWrap) cal.hFormWrap.close();
    }
  }
};

// Initialize calendar when page loads
window.addEventListener('load', cal.init);

// Time display
setInterval(showTime, 1000);
function showTime() {
  const clockElement = document.getElementById("clock");
  if (!clockElement) return;
  
  let time = new Date();
  let hour = time.getHours();
  let min = time.getMinutes();
  let sec = time.getSeconds();
  let am_pm = "AM";

  if (hour > 12) {
    hour -= 12;
    am_pm = "PM";
  }
  if (hour == 0) {
    hour = 12;
    am_pm = "AM";
  }

  hour = hour < 10 ? "0" + hour : hour;
  min = min < 10 ? "0" + min : min;
  sec = sec < 10 ? "0" + sec : sec;

  let currentTime = hour + ":" + min + ":" + sec + am_pm;
  clockElement.innerHTML = currentTime;
}
showTime();

// Health Tips/Notifications Rotator
(function() {
  const tips = [
    "Stay hydrated! Drink at least 8 glasses of water a day.",
    "Wash your hands regularly to prevent illness.",
    "Take a short walk every hour to boost circulation.",
    "Eat a balanced diet rich in fruits and vegetables.",
    "Get at least 7-8 hours of sleep each night.",
    "Remember to take deep breaths and manage stress."
  ];
  let tipIndex = 0;
  const tipAlert = document.getElementById("health-tip-alert");
  const tipText = document.getElementById("health-tip-text");
  
  if (tipAlert && tipText) {
    tipAlert.style.display = "flex";
    function showNextTip() {
      tipText.textContent = tips[tipIndex];
      tipIndex = (tipIndex + 1) % tips.length;
    }
    showNextTip();
    setInterval(showNextTip, 8000);
  }
})();

// Weather functionality
async function getWeather() {
  try {
    const apiKey = "dab1e0cfb7b1ffef8e90df4ddce810d3";
    const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric";
    const city = "Nairobi";
    
    const temp_max = document.querySelector(".temp_max");
    const temp_min = document.querySelector(".temp_min");
    const icon = document.querySelector(".iconw");
    const state = document.querySelector("#state");
    const weatherDetails = document.getElementById("weather-details");
    const weatherHumidity = document.getElementById("weather-humidity");
    const weatherWind = document.getElementById("weather-wind");
    
    const response = await fetch(`${apiUrl}&appid=${apiKey}&q=${city}`);
    const data = await response.json();
    
    if (response.ok) {
      const tempMin = Math.round(data.main.temp_min);
      const tempMax = Math.round(data.main.temp_max);
      
      if (temp_max) temp_max.innerHTML = tempMax;
      if (temp_min) temp_min.innerHTML = tempMin - 5;
      
      if (icon) {
        if (data.weather[0].main == "Clouds") {
          icon.src = "https://img.icons8.com/sf-black/64/FFFFFF/clouds.png";
        } else if (data.weather[0].main == "Clear") {
          icon.src = "https://img.icons8.com/external-kosonicon-outline-kosonicon/64/FFFFFF/external-clear-sky-weather-kosonicon-outline-kosonicon.png";
        } else if (data.weather[0].main == "Rain") {
          icon.src = "https://img.icons8.com/ios/50/FFFFFF/heavy-rain.png";
        } else if (data.weather[0].main == "Drizzle") {
          icon.src = "https://img.icons8.com/ios/50/FFFFFF/light-rain--v1.png";
        } else if (data.weather[0].main == "Mist") {
          icon.src = "https://img.icons8.com/ios/50/FFFFFF/fog-day--v1.png";
        } else {
          icon.src = "https://img.icons8.com/ios/50/FFFFFF/fog-day--v1.png";
        }
      }
      
      if (state) state.innerHTML = city;
      
      // Enhanced details
      if (weatherDetails && weatherHumidity && weatherWind) {
        weatherHumidity.textContent = `Humidity: ${data.main.humidity}%`;
        weatherWind.textContent = `Wind: ${data.wind.speed} m/s`;
        weatherDetails.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Weather fetch error:", error);
  }
}
getWeather();

// User Profile Section Logic
(function() {
  // Note: Using in-memory storage instead of localStorage for user data
  const loggedInEmail = "demo@example.com"; // Hardcoded for demo
  const profileCard = document.getElementById("user-profile-card");
  
  if (!loggedInEmail) {
    if (profileCard) profileCard.style.display = "none";
    return;
  }
  
  // Demo user data
  const user = {
    Name: "Demo User",
    Email: loggedInEmail
  };
  
  if (user && profileCard) {
    const userNameEl = document.getElementById("user-name");
    const userEmailEl = document.getElementById("user-email");
    const userAvatarEl = document.getElementById("user-avatar");
    
    if (userNameEl) userNameEl.textContent = user.Name || "User";
    if (userEmailEl) userEmailEl.textContent = user.Email || loggedInEmail;
    if (userAvatarEl) userAvatarEl.src = "img/amreflogo.png";
    profileCard.style.display = "block";
  } else if (profileCard) {
    profileCard.style.display = "none";
  }
  
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function() {
      // For demo purposes, just reload the page
      window.location.reload();
    });
  }
})();