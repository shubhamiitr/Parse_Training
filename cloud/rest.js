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
exports.smsText = function(request, response){
  var msg = request.params.msg;
  var numbers = request.params.numbers;
  numbers = numbers.join();
  Parse.Cloud.httpRequest({
    url: 'http://174.143.34.193/MtSendSMS/BulkSMS.aspx',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      'usr': 'knitapp',
      'pass': 'knitapp',
      'msisdn': numbers,
      'msg': msg,
      'sid': 'MYKNIT',
      'mt': 0
    }
  }).then(function(httpResponse){
    response.success(httpResponse.text);
  },
  function(httpResponse){
    response.error(httpResponse.data);
  });
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
Function to mail templates
  Input =>
    email: String // emailId of the recipient
    name: String // name of the recipient
    template_name: String
    template_content: Array of object{
      name: String
      content: String
    }
  Output =>
    response: Parse.Promise
  Procedure =>
    Calling sendEmail function of Mandrill to send mail 
*/
function mailTemplate(request){
  //var email = request.email;
  //var name = request.name;
  Mandrill.initialize('GrD1JI_5pNZ6MGUCNBYqUw');
  var response = new Parse.Promise();
  console.log(JSON.stringify());
  Parse.Cloud.httpRequest({
    url: "https://mandrillapp.com/api/1.0/messages/send-template.json",
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8"
    }, 
    body: {
      "key": "GrD1JI_5pNZ6MGUCNBYqUw",
      "template_name": "p2p",
      "template_content": [
         
      ],
      "message": {
          "subject": "Invitation to join Knit",
          "from_email": "knit@trumplab.com",
          "from_name": "Knit",
          "to": [
              {
                  "email": "shubham@trumplab.com",
                  "name": "Shubham"
              }
          ]
      },
      "async": false
    }
  }).then(function(httpResponse){
      console.log(httpResponse.text);
      response.resolve();
    },
    function(httpResponse){
      console.error("Request failed with response code " + httpResponse.status);
      response.reject(httpResponse.data);
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
      return mailTemplate({
        "email": recipient[1],
        "name": recipient[0]
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