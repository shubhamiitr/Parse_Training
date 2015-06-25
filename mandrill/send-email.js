// Create a function to log the response from the Mandrill API
function xlog(obj) {
    $('#response').text(JSON.stringify(obj));
}

// create a new instance of the Mandrill class with your API key
var m = new mandrill.Mandrill('GrD1JI_5pNZ6MGUCNBYqUw');

// create a variable for the API call parameters
var params = {
    "message": {
        "from_email":"kansalshubham46@gmail.com",
        "to":[{"email":"shubham@trumplab.com"}],
        "subject": "Sending a text email from the Mandrill API",
        "html": "<p>I'm learning the Mandrill API at Codecademy.</p>",
        "autotext": "true"
    }
};

function sendTheMail() {
// Send the email!

    m.messages.send(params, function(res) {
        xlog(res);
    }, function(err) {
        xlog(err);
    });
}