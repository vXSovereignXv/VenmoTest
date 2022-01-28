var venmoButton = document.getElementById('venmo-button');
var clientToken = venmoButton.dataset.clientToken;

// Create a client.
braintree.client.create({
    authorization: clientToken
}, function (clientErr, clientInstance) {
    // Stop if there was a problem creating the client.
    // This could happen if there is a network error or if the authorization
    // is invalid.
    if (clientErr) {
        console.error('Error creating client:', clientErr);
        return;
    }

    braintree.dataCollector.create({
        client: clientInstance,
        paypal: true
    }, function (dataCollectorErr, dataCollectorInstance) {
        if (dataCollectorErr) {
            // Handle error in creation of data collector.
            return;
        }

        // At this point, you should access the deviceData value and provide it
        // to your server, e.g. by injecting it into your form as a hidden input.
        console.log('Got device data:', dataCollectorInstance.deviceData);
    });

    braintree.venmo.create({
        client: clientInstance,
        allowDesktop: true,
        paymentMethodUsage: 'single_use', // available in v3.77.0+
        allowNewBrowserTab: false,
        // relaunching in a new tab when returning from the Venmo app. This can
        // be omitted otherwise.
        // allowNewBrowserTab: false
    }, function (venmoErr, venmoInstance) {
        if (venmoErr) {
            console.error('Error creating Venmo:', venmoErr);
            return;
        }

        // Verify browser support before proceeding.
        if (!venmoInstance.isBrowserSupported()) {
            console.log('Browser does not support Venmo');
            return;
        }

        displayVenmoButton(venmoInstance);

        // Check if tokenization results already exist. This occurs when your
        // checkout page is relaunched in a new tab. This step can be omitted
        // if allowNewBrowserTab is false.
        if (venmoInstance.hasTokenizationResult()) {
            venmoInstance.tokenize(function (tokenizeErr, payload) {
                if (err) {
                    handleVenmoError(tokenizeErr);
                } else {
                    handleVenmoSuccess(payload);
                }
            });
            return;
        }
    });
});

function displayVenmoButton(venmoInstance) {
    // Assumes that venmoButton is initially display: none.
    venmoButton.style.display = 'block';

    venmoButton.addEventListener('click', function () {
        venmoButton.disabled = true;

        venmoInstance.tokenize(function (tokenizeErr, payload) {
            venmoButton.removeAttribute('disabled');

            if (tokenizeErr) {
                handleVenmoError(tokenizeErr);
            } else {
                handleVenmoSuccess(payload);
            }
        });
    });
}

function handleVenmoError(err) {
    if (err.code === 'VENMO_CANCELED') {
        console.log('App is not available or user aborted payment flow');
    } else if (err.code === 'VENMO_APP_CANCELED') {
        console.log('User canceled payment flow');
    } else {
        console.error('An error occurred:', err.message);
    }
}

function handleVenmoSuccess(payload) {
    // Send the payment method nonce to your server, e.g. by injecting
    // it into your form as a hidden input.
    console.log('Got a payment method nonce:', payload.nonce);
    // Display the Venmo username in your checkout UI.
    console.log('Venmo user:', payload.details.username);
    alert('Success: ' + payload.details.username);
}
