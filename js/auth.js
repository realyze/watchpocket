$(function() {
  // We need setTimeout because jQuery `ready` is fired too soon so there may
  // be no `chrome` object injected yet.
  setTimeout(function() {
    if (location.search == '?status=done') {
      chrome.runtime.sendMessage({command: 'getOauthRequestToken'}, function(err, reqToken) {
        chrome.runtime.sendMessage({command: 'getOauthAccessToken'}, function(err, accessToken) {
        });
      });
    }
  }, 2000);

	$('#closeTab').click(function(e) {
		e.preventDefault();
		chrome.tabs.getCurrent(function(tab) {
			chrome.tabs.remove(tab.id);
		});
		return false;
	});
});
