var _ = require('underscore');
var Buffer = require('buffer').Buffer;
var Mandrill = require('mandrill');
var schoolapi = require('cloud/school_api.js');

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

function loadPdf(pdfUrl, callback){
	var promise = new Parse.Promise();
	Parse.Cloud.httpRequest({
		url: pdfUrl,
		headers:{
			'Content-Type': 'application/pdf'
		}
	}).then(function(httpResponse){
		var buf = httpResponse.buffer;
		var content = buf.toString('base64');
		callback.success(content);
	},
	function(httpResponse){
		callback.error('Request failed with response code ' + httpResponse.status);
	});
}

Parse.Cloud.define("mailPdf", function(request, response){
	loadPdf(request.params.url,{
		success: function(content){
			console.log(content);
			Mandrill.initialize('GrD1JI_5pNZ6MGUCNBYqUw');
			Mandrill.sendEmail({
			  message: {
			    text: "Follow the attachment",
			    subject: "Sending PDF as attachment",
			    from_email: "kansalshubham46@gmail.com",
			    from_name: "bluej",
			    to: [
			      {
			        email: "shubham@trumplab.com",
			        name: "Shubham"
			      }
			    ],
			    attachments: [
			  		{
			  			type: "application/pdf",
			  			name: "sample.pdf",
			  			content: content
			  		}
			  	],
			  },
			  async: true
			},{
			  success: function(httpResponse) {
			    response.success("Email sent!");
				},
			  error: function(httpResponse) {
			    response.error("Uh oh, something went wrong");
			  }
			});
		},
		error: function(error){
			response.error(error);
		}
	});
});

Parse.Cloud.define("areaAutoComplete", function(request, response) {
    schoolapi.areaAutoComplete(request, response);
});

Parse.Cloud.define("schoolsNearby", function(request, response) {
    schoolapi.schoolsNearby(request, response);
});