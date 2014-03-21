$(function() {
  if (location.search == '?secret=MyLittlePinkPony') {
    window.alert('auth done? ' + typeof(chrome.runtime.sendMessage));
    chrome.runtime.sendMessage({command: 'getOauthRequestToken'}, function(err, reqToken) {
      chrome.runtime.sendMessage({command: 'getOauthAccessToken'}, function(err, accessToken) {
        window.alert('auth success');
      });
    });

    $('#closeTab').click(function(e) {
      e.preventDefault();
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id);
      });
      return false;
    });
  }
});
