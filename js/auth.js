
//watchpocket = window.watchpocket || chrome.extension.getBackgroundPage().watchpocket;

$(function() {
	if (location.search == '?status=done') {
    window.alert('1');
    chrome.runtime.sendMessage({command: 'getOauthRequestToken'}, function(err, reqToken) {
      window.alert('2');
      chrome.runtime.sendMessage({command: 'getOauthAccessToken'}, function(err, accessToken) {
        window.alert('3');
        window.alert('auth done, yay!');
      });
    });
  }

	$('#closeTab').click(function(e) {
		e.preventDefault();
		chrome.tabs.getCurrent(function(tab) {
			chrome.tabs.remove(tab.id);
		});
		return false;
	});
});
