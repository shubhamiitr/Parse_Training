var _ = require('underscore');
var Buffer = require('buffer').Buffer;
var Mandrill = require('mandrill');
var schoolapi = require('cloud/school_api.js');
var rest = require('cloud/rest.js');
 
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});
 
Parse.Cloud.beforeSave("Review", function(request, response){
  if(request.object.get("stars") < 1){
      response.error("You cannot give less than 1 star");
  }
  else if(request.object.get("stars") > 5){
      response.error("You cannot give more than 5 stars");
  }
  else{
      response.success();
  }
});

function checkValidStars(review, callback){
  if(review.get("stars") < 1){
      return callback.error("You cannot give less than 1 star");
  }
  else if(review.get("stars") > 5){
      return callback.error("You cannot give more than 5 stars");
  }
  else{
      return callback.success();
  }
};
 
Parse.Cloud.define("insertReviewWithTrigger",function(request, response){
  var Review = Parse.Object.extend("Review");
  var newReview = new Review(request.params);

  newReview.save().then(
      function(obj){
          response.success("Movie Review inserted successfully !");
      },
      function(error){
          response.error(error.message);
      }
  )
});
 
Parse.Cloud.define("insertReview",function(request, response){
 
  var Review = Parse.Object.extend("Review");
  var newReview = new Review(request.params);

  checkValidStars(newReview, {
      success: function(){
          newReview.save().then(
              function(obj){
                  //console.log("obj"+obj);
                  response.success("Movie Review inserted successfully !");
              },
              function(error){
                  response.error("Movie Review insertion failed");
              }
          )
      },
      error: function(error){
          response.error(error);
      }
  });
});
 
Parse.Cloud.define("averageStars", function(request, response){
  var query = new Parse.Query("Review");
  query.equalTo("movie", request.params.movie);
  query.find().then(function(results){
          var totalStars = _.reduce(results, function(sum, result){
              return sum + result.get("stars");
          }, 0)
          response.success(totalStars/results.length);
      },
      function(error){
          response.error("Movie lookup failed");
      }
  );
});
 
Parse.Cloud.define("mailPdf", function(request, response){
  Mandrill.initialize('GrD1JI_5pNZ6MGUCNBYqUw');
  Mandrill.sendEmail({
    message: {
      text: "Follow the attachment",
      subject: "Instructions to subscribe to class",
      from_email: "shubham@trumplab.com",
      from_name: "Shubham Kansal",
      to: [
        {
          email: request.params.username 
        }
      ],
      attachments: [
          {
              type: "application/pdf",
              name: "Instructions.pdf",
              content: request.params.content
          }
      ],
    },
    async: true
  },{
    success: function(httpResponse) {
      response.success(httpResponse);
      },
    error: function(httpResponse) {
      response.error(httpResponse);
    }
  });
});
 
Parse.Cloud.define("areaAutoComplete", function(request, response) {
    schoolapi.areaAutoComplete(request, response);
});
 
Parse.Cloud.define("schoolsNearby", function(request, response) {
    schoolapi.schoolsNearby(request, response);
});

Parse.Cloud.define("inviteUsers", function(request, response){
    rest.inviteUsers(request, response);
});

Parse.Cloud.define("signUp", function(request, response){
  Parse.Cloud.httpRequest({
    method: "POST",
    url: "https://api.parse.com/1/users",
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'X-Parse-Application-Id': '6PdBHboWXHwa3En35mAXjrZtC783NpakLhMYjsfX',
      'X-Parse-REST-API-Key': 'sZ4GFrwyClNwCDz1VVRWvj9F6A8vHFL02mY8AKMz',
    },
    body: request.params
  }).then(function(httpResponse){
    var token = JSON.parse(httpResponse.text).sessionToken;
    return Parse.Cloud.httpRequest({
      method: "POST",
      url: "https://api.parse.com/1/upgradeToRevocableSession",
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'X-Parse-Application-Id': '6PdBHboWXHwa3En35mAXjrZtC783NpakLhMYjsfX',
        'X-Parse-REST-API-Key': 'sZ4GFrwyClNwCDz1VVRWvj9F6A8vHFL02mY8AKMz', 
        'X-Parse-Session-Token': token
      }
    });
  }).then(function(httpResponse){
    response.success(httpResponse.text); 
  },
  function(httpResponse){
    response.error(httpResponse.text);
  });
});

Parse.Cloud.define("login", function(request, response){
  Parse.Cloud.httpRequest({
    url: "https://api.parse.com/1/login",
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'X-Parse-Application-Id': '6PdBHboWXHwa3En35mAXjrZtC783NpakLhMYjsfX',
      'X-Parse-REST-API-Key': 'sZ4GFrwyClNwCDz1VVRWvj9F6A8vHFL02mY8AKMz'
    },
    params: request.params
  }).then(function(httpResponse){
    response.success(httpResponse.text);
  },
  function(httpResponse){
    response.error(httpResponse.text);
  });
});

Parse.Cloud.define("apps", function(request, response){
  Parse.Cloud.httpRequest({
    url: "https://api.parse.com/1/apps/",
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'X-Parse-Email': 'shubham@trumplab.com',
      'X-Parse-Password': 'sakbhcad'
    }
  }).then(function(httpResponse){
    response.success(httpResponse.data.results);
  },
  function(httpResponse){
    response.error(httpResponse.text);
  });
});

Parse.Cloud.define("checkTime", function(request, response){
  var date = new Date();
  response.success(date.getHours());
});

Parse.Cloud.job("notifyTime", function(request, status){
  var date = new Date();
  var msg = date.toString();
  status.message(msg);
  status.success();
});

Parse.Cloud.define("emptyTable", function(request, response){
  var table = request.params.table;
  var promise = Parse.Promise.as();
  var query = new Parse.Query(table);
  var logs = [];
  query.each(function(result){
    logs.push(result.get("strength"));
    return result.destroy();
  }).then(function(obj){
    console.log(logs);
    response.success(obj);
  }, function(error){
    response.error(error);
  });
});

Parse.Cloud.define("fill", function(request, response){
  var Monster = Parse.Object.extend("Monster");
  var promise = Parse.Promise.as(0);
  for(var i = 0; i < 200; i++){
    promise = promise.then(function(idx){
      var monster = new Monster();
      monster.set("strength", idx);
      return monster.save().then(function(){
        return Parse.Promise.as(idx + 1);
      });
    });
  }
  promise.then(function(){
    response.success("Filled");
  }, function(error){
    response.error(error);
  });
});

Parse.Cloud.define("smsText", function(request, response){
  rest.smsText(request, response);
});