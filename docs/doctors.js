// doctors.js

document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('#doctorAppointmentsTable tbody');
    const container = document.querySelector('.container');

    // --- Feature 1: Filtering by status ---
    const filterDiv = document.createElement('div');
    filterDiv.className = 'mb-3 d-flex flex-wrap gap-2 align-items-center';
    filterDiv.innerHTML = `
        <label class="form-label mb-0 me-2">Filter by status:</label>
        <select id="statusFilter" class="form-select w-auto">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
        </select>
        <input id="searchInput" class="form-control ms-3" style="max-width:220px;" type="text" placeholder="Search by patient, doctor, date...">
    `;
    container.insertBefore(filterDiv, container.querySelector('.table-responsive'));

    // --- Feature 3: Appointment Details Modal ---
    const detailsModal = document.createElement('div');
    detailsModal.className = 'modal fade';
    detailsModal.id = 'detailsModal';
    detailsModal.tabIndex = -1;
    detailsModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Appointment Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="detailsModalBody"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(detailsModal);

    // --- Feature 4: Cancel Modal ---
    const cancelModal = document.createElement('div');
    cancelModal.className = 'modal fade';
    cancelModal.id = 'cancelModal';
    cancelModal.tabIndex = -1;
    cancelModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Cancel Appointment</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <label for="cancelReason" class="form-label">Reason for cancellation:</label>
            <textarea id="cancelReason" class="form-control" rows="3"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-danger" id="confirmCancelBtn">Cancel Appointment</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(cancelModal);

    // --- Feature 5: Notes Modal ---
    const notesModal = document.createElement('div');
    notesModal.className = 'modal fade';
    notesModal.id = 'notesModal';
    notesModal.tabIndex = -1;
    notesModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Appointment Notes</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <textarea id="notesTextarea" class="form-control" rows="5"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" id="saveNotesBtn">Save Notes</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(notesModal);

    // --- State for modals ---
    let currentCancelIdx = null;
    let currentNotesIdx = null;

    function getAppointments() {
        return JSON.parse(localStorage.getItem('confirmedAppointments') || '[]');
    }
    function saveAppointments(appointments) {
        localStorage.setItem('confirmedAppointments', JSON.stringify(appointments));
    }
    function renderTable() {
        const appointments = getAppointments();
        const statusFilter = document.getElementById('statusFilter').value;
        const searchValue = document.getElementById('searchInput').value.toLowerCase();
        tableBody.innerHTML = '';
        let filtered = appointments.filter(appt => {
            let matchStatus = statusFilter === 'all' || appt.status === statusFilter;
            let matchSearch =
                (appt.patientName || '').toLowerCase().includes(searchValue) ||
                (appt.doctorName || appt.doctor || '').toLowerCase().includes(searchValue) ||
                (appt.date || '').toLowerCase().includes(searchValue);
            return matchStatus && matchSearch;
        });
        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No appointments found.</td></tr>';
            return;
        }
        filtered.forEach((appt, idx) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appt.patientName || ''}</td>
                <td>${appt.patientEmail || ''}</td>
                <td>${appt.patientPhone || ''}</td>
                <td>${appt.doctorName || appt.doctor || ''}</td>
                <td>${appt.date || ''}</td>
                <td>${appt.time || ''}</td>
                <td>${getStatusBadge(appt.status)}</td>
                <td>
                    <button class="btn btn-sm btn-info view-details me-1" data-idx="${idx}">Details</button>
                    <button class="btn btn-sm btn-secondary edit-notes me-1" data-idx="${idx}">Notes</button>
                    ${appt.status === 'pending' ? `
                        <button class="btn btn-sm btn-primary mark-upcoming me-1" data-idx="${idx}">Mark Upcoming</button>
                        <button class="btn btn-sm btn-success mark-completed me-1" data-idx="${idx}">Mark Completed</button>
                        <button class="btn btn-sm btn-danger cancel-appt" data-idx="${idx}">Cancel</button>
                    ` : appt.status === 'upcoming' ? `
                        <button class="btn btn-sm btn-success mark-completed me-1" data-idx="${idx}">Mark Completed</button>
                        <button class="btn btn-sm btn-danger cancel-appt" data-idx="${idx}">Cancel</button>
                    ` : '<span class="text-muted">-</span>'}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    function getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge bg-warning text-dark">Pending</span>',
            upcoming: '<span class="badge bg-primary">Upcoming</span>',
            completed: '<span class="badge bg-success">Completed</span>',
            cancelled: '<span class="badge bg-danger">Cancelled</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
    }
    // Filtering and search
    document.getElementById('statusFilter').addEventListener('change', renderTable);
    document.getElementById('searchInput').addEventListener('input', renderTable);

    // Table actions
    tableBody.addEventListener('click', function(e) {
        const idx = e.target.getAttribute('data-idx');
        if (e.target.classList.contains('mark-upcoming')) {
            updateStatus(idx, 'upcoming');
        } else if (e.target.classList.contains('mark-completed')) {
            updateStatus(idx, 'completed');
        } else if (e.target.classList.contains('cancel-appt')) {
            currentCancelIdx = idx;
            document.getElementById('cancelReason').value = '';
            const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
            modal.show();
        } else if (e.target.classList.contains('view-details')) {
            showDetailsModal(idx);
        } else if (e.target.classList.contains('edit-notes')) {
            currentNotesIdx = idx;
            const appointments = getAppointments();
            document.getElementById('notesTextarea').value = appointments[idx].notes || '';
            const modal = new bootstrap.Modal(document.getElementById('notesModal'));
            modal.show();
        }
    });
    // Cancel modal confirm
    document.getElementById('confirmCancelBtn').addEventListener('click', function() {
        const reason = document.getElementById('cancelReason').value.trim();
        if (!reason) {
            alert('Please provide a reason for cancellation.');
            return;
        }
        updateStatus(currentCancelIdx, 'cancelled', reason);
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
        modal.hide();
    });
    // Notes modal save
    document.getElementById('saveNotesBtn').addEventListener('click', function() {
        const notes = document.getElementById('notesTextarea').value;
        const appointments = getAppointments();
        if (appointments[currentNotesIdx]) {
            appointments[currentNotesIdx].notes = notes;
            saveAppointments(appointments);
            renderTable();
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('notesModal'));
        modal.hide();
    });
    function updateStatus(idx, newStatus, cancelReason) {
        const appointments = getAppointments();
        if (appointments[idx]) {
            appointments[idx].status = newStatus;
            if (newStatus === 'cancelled' && cancelReason) {
                appointments[idx].cancelReason = cancelReason;
            }
            saveAppointments(appointments);
            renderTable();
        }
    }
    function showDetailsModal(idx) {
        const appointments = getAppointments();
        const appt = appointments[idx];
        let html = `<ul class="list-group">
            <li class="list-group-item"><b>Patient Name:</b> ${appt.patientName || ''}</li>
            <li class="list-group-item"><b>Email:</b> ${appt.patientEmail || ''}</li>
            <li class="list-group-item"><b>Phone:</b> ${appt.patientPhone || ''}</li>
            <li class="list-group-item"><b>Doctor:</b> ${appt.doctorName || appt.doctor || ''}</li>
            <li class="list-group-item"><b>Date:</b> ${appt.date || ''}</li>
            <li class="list-group-item"><b>Time:</b> ${appt.time || ''}</li>
            <li class="list-group-item"><b>Status:</b> ${getStatusBadge(appt.status)}</li>
            <li class="list-group-item"><b>Notes:</b> ${appt.notes ? appt.notes : '<span class="text-muted">None</span>'}</li>
            ${appt.status === 'cancelled' && appt.cancelReason ? `<li class="list-group-item"><b>Cancel Reason:</b> ${appt.cancelReason}</li>` : ''}
        </ul>`;
        document.getElementById('detailsModalBody').innerHTML = html;
        const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    }
    // --- Book Appointment Modal Logic ---
    const openBookModalBtn = document.getElementById('openBookModal');
    const bookAppointmentModal = document.getElementById('bookAppointmentModal');
    const bookAppointmentForm = document.getElementById('bookAppointmentForm');
    if (openBookModalBtn && bookAppointmentModal) {
        openBookModalBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(bookAppointmentModal);
            modal.show();
        });
    }
    if (bookAppointmentForm) {
        bookAppointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(bookAppointmentForm);
            // --- Validation ---
            const patientName = formData.get('patientName').trim();
            const patientEmail = formData.get('patientEmail').trim();
            const patientPhone = formData.get('patientPhone').trim();
            const doctorName = formData.get('doctorName').trim();
            const date = formData.get('date');
            const time = formData.get('time');
            const reason = formData.get('reason').trim();
            let error = '';
            if (!patientName || !patientEmail || !patientPhone || !doctorName || !date || !time) {
                error = 'All fields are required.';
            } else if (!/^\S+@\S+\.\S+$/.test(patientEmail)) {
                error = 'Invalid email address.';
            } else if (!/^\+?\d{7,15}$/.test(patientPhone.replace(/\s/g, ''))) {
                error = 'Invalid phone number.';
            } else {
                // Check if date/time is in the future
                const apptDateTime = new Date(date + 'T' + time);
                if (apptDateTime < new Date()) {
                    error = 'Appointment date and time must be in the future.';
                }
            }
            if (error) {
                showNotification(error, 'danger');
                return;
            }
            // --- Generate unique meeting link ---
            function randomCode(len = 12) {
                const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
                let code = '';
                for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
                return code.match(/.{1,4}/g).join('-');
            }
            const meetLink = `https://demo.videosdk.live/conference-meeting/${randomCode()}`;
            const newAppointment = {
                patientName,
                patientEmail,
                patientPhone,
                doctorName,
                date,
                time,
                reason,
                status: 'pending',
                meetLink,
                notes: ''
            };
            const appointments = getAppointments();
            appointments.push(newAppointment);
            saveAppointments(appointments);
            renderTable();
            // Close modal
            const modal = bootstrap.Modal.getInstance(bookAppointmentModal);
            modal.hide();
            bookAppointmentForm.reset();
            showNotification('Appointment booked successfully!', 'success');
        });
    }

    // Notification helper
    function showNotification(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-4`;
        alertDiv.textContent = message;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.style.zIndex = 9999;
        document.body.appendChild(alertDiv);
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
    renderTable();
}); 