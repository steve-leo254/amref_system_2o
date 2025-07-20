// All checkout logic moved from checkout.html

document.addEventListener('DOMContentLoaded', function() {
    const checkoutButton = document.getElementById('checkoutButton');
    const paymentModal = document.getElementById('paymentModal');
    const closeButton = paymentModal.querySelector('.close-button');
    const paymentOptionButtons = paymentModal.querySelectorAll('.payment-option-button');
    const mobilePaymentDetailsDiv = document.getElementById('mobilePaymentDetails');
    const creditCardDetailsDiv = document.getElementById('creditCardDetails');
    const otherPaymentDetailsDiv = document.getElementById('otherPaymentDetails');
    const payButton = document.getElementById('payButton');
    const retryButton = document.getElementById('retryButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const downloadReceiptButton = document.getElementById('downloadReceiptButton');
    const successMessage = document.getElementById('successMessage');

    let selectedPaymentMethod = null;

    checkoutButton.addEventListener('click', function() {
        paymentModal.style.display = "block";
    });

    closeButton.addEventListener('click', function() {
        paymentModal.style.display = "none";
        resetPaymentDetails();
        showPaymentOptionsAndPayButton();
    });

    window.addEventListener('click', function(event) {
        if (event.target == paymentModal) {
            paymentModal.style.display = "none";
            resetPaymentDetails();
            showPaymentOptionsAndPayButton();
        }
    });

    paymentOptionButtons.forEach(button => {
        button.addEventListener('click', function() {
            resetPaymentDetails();
            selectedPaymentMethod = this.dataset.payment;
            paymentOptionButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');

            if (selectedPaymentMethod === 'safaricom' || selectedPaymentMethod === 'airtel') {
                mobilePaymentDetailsDiv.style.display = "block";
                otherPaymentDetailsDiv.style.display = "none";
                creditCardDetailsDiv.style.display = "none";
            } else if (selectedPaymentMethod === 'creditcard') {
                creditCardDetailsDiv.style.display = "block";
                mobilePaymentDetailsDiv.style.display = "none";
                otherPaymentDetailsDiv.style.display = "none";
            } else {
                otherPaymentDetailsDiv.style.display = "block";
                mobilePaymentDetailsDiv.style.display = "none";
                creditCardDetailsDiv.style.display = "none";
            }
        });
    });

    payButton.addEventListener('click', function() {
        if (!selectedPaymentMethod) {
            alert("Please select a payment method.");
            return;
        }

        loadingSpinner.style.display = "block";
        payButton.disabled = true;
        hidePaymentOptions();

        setTimeout(function() {
            let paymentSuccessful = Math.random() < 0.7;
            loadingSpinner.style.display = "none";
            payButton.disabled = false;

            if (paymentSuccessful) {
                alert("Payment successful!");
                paymentModal.style.display = "none";
                resetPaymentDetails();
                showPaymentOptionsAndPayButton();

                const pendingAppointment = localStorage.getItem('pendingAppointment');
                if (pendingAppointment) {
                    localStorage.removeItem('pendingAppointment');
                    let confirmedAppointments = JSON.parse(localStorage.getItem('confirmedAppointments') || '[]');
                    const appointmentData = JSON.parse(pendingAppointment);
                    confirmedAppointments.push(appointmentData);
                    localStorage.setItem('confirmedAppointments', JSON.stringify(confirmedAppointments));
                    document.getElementById('downloadReceiptButton').style.display = 'inline-block';
                    successMessage.textContent = 'Your payment has been processed successfully! Your receipt is now available for download.';
                    successMessage.style.display = 'block';
                }
                // Always redirect after payment success
                console.log('Redirecting to prescription.html after payment success');
                setTimeout(() => {
                    window.location.href = 'prescription.html';
                }, 1500);
            } else {
                alert("Payment failed. Please try again.");
                retryButton.style.display = "block";
                payButton.style.display = "none";
                showPaymentOptions();
            }
        }, 2000);
    });

    retryButton.addEventListener('click', function() {
        retryButton.style.display = "none";
        payButton.style.display = "block";
        showPaymentOptions();
    });

    function resetPaymentDetails() {
        paymentOptionButtons.forEach(btn => btn.classList.remove('selected'));
        mobilePaymentDetailsDiv.style.display = "none";
        creditCardDetailsDiv.style.display = "none";
        otherPaymentDetailsDiv.style.display = "none";
        selectedPaymentMethod = null;
        document.getElementById('phoneNumber').value = '';
        document.getElementById('confirmationNumber').value = '';
        document.getElementById('cardNumber').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('cvv').value = '';
    }

    function hidePaymentOptions() {
        document.querySelector('.payment-options').style.display = 'none';
    }

    function showPaymentOptions() {
        document.querySelector('.payment-options').style.display = 'flex';
    }

    function showPaymentOptionsAndPayButton() {
        showPaymentOptions();
        payButton.style.display = 'block';
        retryButton.style.display = 'none';
    }

    // Receipt logic
    downloadReceiptButton.addEventListener('click', function() {
        let appt = null;
        const pending = localStorage.getItem('pendingAppointment');
        if (pending) {
            appt = JSON.parse(pending);
        } else {
            let confirmed = JSON.parse(localStorage.getItem('confirmedAppointments') || '[]');
            if (confirmed.length > 0) {
                appt = confirmed[confirmed.length - 1];
            }
        }
        const receiptContentModal = document.getElementById('receiptContentModal');
        if (!appt) {
            receiptContentModal.innerHTML = '<div class="text-danger">No appointment data found. Please complete a booking first.</div>';
            document.getElementById('downloadPdfBtn').disabled = true;
            document.getElementById('printReceiptBtn').disabled = true;
            return;
        }
        const html = `
            <div class='text-center mb-3'><img src='img/amreflogo.png' alt='Amref Logo' style='width:50px;height:50px;'/></div>
            <div class='receipt-header mb-2'>Amref Appointment Receipt</div>
            <hr/>
            <div class='receipt-label'>Patient Name:</div><div class='receipt-value mb-2'>${appt.patientName || ''}</div>
            <div class='receipt-label'>Email:</div><div class='receipt-value mb-2'>${appt.patientEmail || ''}</div>
            <div class='receipt-label'>Phone:</div><div class='receipt-value mb-2'>${appt.patientPhone || ''}</div>
            <div class='receipt-label'>Doctor:</div><div class='receipt-value mb-2'>${appt.doctorName || appt.doctor || ''}</div>
            <div class='receipt-label'>Specialization:</div><div class=' receipt-value mb-2'>${appt.specialization || ''}</div>
            <div class='receipt-label'>Hospital:</div><div class='receipt-value mb-2'>${appt.hospital || ''}</div>
            <div class='receipt-label'>Date:</div><div class='receipt-value mb-2'>${appt.date || ''}</div>
            <div class='receipt-label'>Time:</div><div class='receipt-value mb-2'>${appt.time || ''}</div>
            <div class='receipt-label'>Reason:</div><div class='receipt-value mb-2'>${appt.reason || ''}</div>
            <hr/>
            <div style='font-size:0.95em;color:#888;'>Thank you for booking with Amref. Please keep this receipt for your records.</div>
        `;
        receiptContentModal.innerHTML = html;
    });

    var receiptModal = document.getElementById('receiptModal');
    receiptModal.addEventListener('shown.bs.modal', function () {
        var printBtn = document.getElementById('printReceiptBtn');
        var pdfBtn = document.getElementById('downloadPdfBtn');
        var spinner = pdfBtn.querySelector('.spinner-border');
        var content = document.getElementById('receiptContentModal').innerHTML.trim();

        // Enable buttons only if content is present
        printBtn.disabled = !content;
        pdfBtn.disabled = !content;

        printBtn.onclick = function() {
            var printContents = document.getElementById('receiptContentModal').innerHTML;
            if (!printContents) {
                alert('No receipt content to print.');
                return;
            }
            var printWindow = window.open('', '', 'width=600,height=700');
            printWindow.document.write('<html><head><title>Appointment Receipt</title>');
            printWindow.document.write('<link rel="stylesheet" href="appointment.css">');
            printWindow.document.write('</head><body>' + printContents + '</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
        pdfBtn.onclick = function() {
            var element = document.createElement('div');
            element.innerHTML = document.getElementById('receiptContentModal').innerHTML;
            if (!element.innerHTML.trim()) {
                alert('No receipt content to download.');
                return;
            }
            const opt = {
                margin: 10,
                filename: 'appointment-receipt.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            spinner.style.display = 'inline-block';
            pdfBtn.disabled = true;
            html2pdf().set(opt).from(element).save().then(() => {
                spinner.style.display = 'none';
                pdfBtn.disabled = false;
            }).catch(err => {
                spinner.style.display = 'none';
                pdfBtn.disabled = false;
                alert('Failed to generate PDF.');
                console.error('PDF generation error:', err);
            });
        };
    });
});
