var _ = require('underscore.js');
var Mandrill = require('mandrill');

/*
Function to send sms
  Input =>
    msg: String
    phone: String // number of the recipient
  Output =>
    response: Parse.Promise
  Procedure =>
    Sending a HTTPRequest to smsgupshup API
*/
function smsText(requestObj, response){
  var msg = requestObj.msg;
  var phone = requestObj.phone;
  var response = new Parse.Promise();
  Parse.Cloud.httpRequest({
    url: 'http://enterprise.smsgupshup.com/GatewayAPI/rest',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      method: 'sendMessage',
      send_to: phone,
      msg: msg,
      msg_type: 'Text',
      userid: '2000133095',
      auth_scheme: 'plain',
      password: 'wdq6tyUzP',
      v: '1.1',
      format: 'text'
    }
  }).then(function(httpResponse){
    var status = httpResponse.text.substr(0,3);
    if(status == "suc")
      response.resolve();
    else{
      response.reject("Failed to send message to " + phone);
    }
  },
  function(httpResponse){
    response.reject("Request failed with response code " + httpResponse.status);
  });
  return response;
}

/*
Function to send mail 
  Input =>
    text: String
    email: String // emailId of the recipient
    name: String // name of the recipient
  Output =>
    response: Parse.Promise
  Procedure =>
    Calling sendEmail function of Mandrill to send mail 
*/
function mailText(requestObj, response){
  var text = requestObj.text;
  var email = requestObj.email;
  var name = requestObj.name;
  var recipient = requestObj.recipient;
  Mandrill.initialize('GrD1JI_5pNZ6MGUCNBYqUw');
  var response = new Parse.Promise();
  Mandrill.sendEmail({
    message: {
      from_email: "shubham@trumplab.com",
      from_name: "Knit",
      subject: "Invitation to join Knit",
      text: text,
      to: [
        {
          email: email,
          name: name 
        }
      ]
    },
    async: true
  },{
    success: function(httpResponse){
      response.resolve();
    },
    error: function(httpResponse){
      response.reject("Request failed with response code " + httpResponse.status);
    }
  });
  return response;
} 

/*
Function to invite users
  Input =>
    classCode: String
    type: Number 
    mode: String // phone or email
    data: JSON object{
      name: String
      <Phone Mode>
        phone: String // Phone Mode
      <Email Mode>
        email: String
    } 
  Output =>
    flag: Bool
  Procedure =>  
    Calling mailText and smsText function according to mode input 
  TODO =>
    Rectify users that already have Knit App installed
*/
exports.inviteUsers = function(request, response){
  var classCode = request.params.classCode;
  var type = request.params.type;
  var recipients = request.params.data;
  var mode = request.params.mode;
  var text = "Hello I have recently started using a great communication tool, Knit Messaging, and I will be using it to send out reminders and announcements. To join my classroom you can use my classcode " + classCode + ".";
  if(mode == "phone"){
    var promises = _.map(recipients, function(recipient){
      return smsText({
        "phone": recipient[1], 
        "msg": text
      });
    });
    Parse.Promise.when(promises).then(function(){
      response.success(true);
    },
    function(error){
      response.error(error);
    });  
  }
  else if(mode == "email"){
    var promises = _.map(recipients, function(recipient){
      return mailText({
        "email": recipient[1],
        "name": recipient[0], 
        "text": text
      });
    });
    Parse.Promise.when(promises).then(function(){
      response.success(true);
    },
    function(error){
      response.error(error);
    });  
  }
}