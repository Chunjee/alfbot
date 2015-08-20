/*
function Fn_Addquote() {

}
*/

function Fn_QuickRegEx(para_Input,para_Regex,para_returnvalue) {
  //console.log(Fn_QuickRegEx(message,/(.+)/));
  para_returnvalue = para_returnvalue || 1;
  var ReturnValue = para_Regex.exec(para_Input);
  return ReturnValue[para_returnvalue]
}


Meteor.methods({
//Allows the client to clear the messages
	'Fn_Addquote' : function(para_params) {
		if(para_params.userinput != "") {
			console.log(para_params.userinput);
			var l_message = Fn_QuickRegEx(para_params.message,/:(.+)/);
			var l_username = Fn_QuickRegEx(para_params.message,/(.+)\:./);

			//Only insert to DB if username and message could be extracted. add check if quote exists later
			if(l_username && l_message)
			QuotesDB.insert({
		      rawmessage: para_params.message,
		      message: l_message,
		      username: l_username,
		      addedby: para_params.from,
		      timestamp: Date.now()
		    });
		}
	}
});