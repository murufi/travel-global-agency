function generateTransactionId() {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var transactionId = '';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
    transactionId += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return transactionId;
}

function app_payment(formdtls){
    event.preventDefault();
    var email_form = $('#email_form').val();
    var fname_form = $('#fname_form').val();
    var lname_form = $('#lname_form').val();
    var service_name_form = $('#service_name_form').val();
    var number_of_app_form = $('#number_of_app_form').val();
    var amount_payable_form2 = $('#amount_payable_form2').val();

    var amtt = amount_payable_form2;
    var tff = (0.321/100) * Number(amtt);
    if(tff > 2000){
        var vp = Math.round(Number(amtt) + 2000);
    }else{
        var vp = Math.round(Number(amtt) + tff);
    }
    var handler = PaystackPop.setup({
        key: 'pk_live_4b7cddab1d616bf73769a52f3f13ee4cefca138a', // Replace with your public key
        email: email_form,
        name: fname_form+' '+lname_form,
        services: service_name_form,
        no_app: number_of_app_form,
        amount: vp * 100, // the amount value is multiplied by 100 to convert to the lowest currency unit
        currency: 'NGN', // Use GHS for Ghana Cedis or USD for US Dollars
        ref: 'TATAgency_Application_'+generateTransactionId(), // Replace with a reference you generated
        callback: function(response) {
            //this happens after the payment is completed successfully
            var reference = response.reference;
            paystack_payment_verify(response.reference, formdtls);
            toastr["success"]('Processing Payment. Please Wait...');
            // Make an AJAX call to your server with the reference to verify the transaction
        },
        onClose: function() {
            $('#action_btn').html('<button type="button" class="btn btn-warning" id="retrun_btn" onclick="return_btn()" >return</button>\
                            <button type="button" class="btn btn-primary" id="pay_btn" onclick="pay_btn()">Start Application Now</button>');
        },
    });
    handler.openIframe();

}

function paystack_payment_verify(r, x) {
    event.preventDefault();
    $.ajaxSetup({
        headers: {
          'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
      });
    $.ajax({
        type: 'POST',
        url: '/verify_app_payment',
        data: {
            ref: r,
        },
        success: function (response) {
            if(response == 'Success'){
                toastr["success"]('Payment Completed Successfuly Please wait');
                $.ajaxSetup({
                    headers: {
                      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    }
                  });
                  $.ajax({
                    url: '/new_application',
                    type: 'POST',
                    data: x,
                    success: function (response) {
                        if(response.status == 'Success'){
                            $('#application_view').modal('hide');
                            Swal.fire({
                                title: "Successful",
                                text: "Your payment have been confirmed.. Kindly proceed to fill the questionnaire our expert would contact you shortly to guide you through the process",
                                icon: "success",
                                showCancelButton: true,
                                confirmButtonColor: "#3085d6",
                                cancelButtonColor: "#d33",
                                confirmButtonText: "Proceed to questionnaire!"
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  Swal.fire({
                                    text: "Redirecting to questionnaire page. Please Wait",
                                    icon: "success"
                                  });
                                    const redirectUrl = new URL('https://tatagencyportal.com/new_app.php');
                                    // Assuming 'response' contains data you want to pass as query parameters
                                    const params = {
                                        app_id: response.app_id
                                    };
                                    // Add each parameter to the URL
                                    Object.keys(params).forEach(key => {
                                        redirectUrl.searchParams.append(key, params[key]);
                                    });
                                    
                                    // Perform the redirect
                                    window.location.href = redirectUrl;
                                }
                              });
                            
                        }
                        
                    }
                });
                //setTimeout(function(){ location.reload(); }, 2000);
            }else {
                toastr["error"](response)
                document.getElementById('loadingOverlay').style.display = 'none';
            }
        }
    });
}