var watchpocket = watchpocket || {};

watchpocket.getRequestToken = function() {
  return watchpocket.post(
    'https://getpocket.com/v3/oauth/request',
    JSON.stringify({
      'consumer_key' : watchpocket.consumerKey,
      'redirect_uri' : chrome.extension.getURL('auth.html') + '?secret=MyLittlePinkPony'
    })
  ).then(function(response) {
    oauthRequestToken = response.code;
    watchpocket.getAuthorization(response.code);
  });
};


watchpocket.getOauthAccessToken = function() {
  var defer = Q.defer();
  chrome.storage.sync.get('oauthAccessToken', function(items) {
    console.log('oauth access token: ' + items.oauthAccessToken);
    defer.resolve(items.oauthAccessToken);
  });
  return defer.promise;
};

watchpocket.getAuthorization = function(requestToken) {
  var url = [
    'https://getpocket.com/auth/authorize?request_token=',
    requestToken,
    '&redirect_uri=',
    chrome.extension.getURL('auth.html') + '?secret=MyLittlePinkPony'
  ].join('');

  chrome.tabs.query({active: true}, function(tabs) {
    if (tabs.length === 0) {
      console.error('no active tab found');
      return;
    }
    chrome.tabs.update(tabs[0].id, {url:url}, function(){
      console.log('updated tab');
      // TODO(Tom): Close the popup.
    });
  });
};

watchpocket.getAccessToken = function() {
  var defer = Q.defer();

  watchpocket.post(
    'https://getpocket.com/v3/oauth/authorize',
    JSON.stringify({
      'consumer_key' : watchpocket.consumerKey,
      'code'         : oauthRequestToken
    })
  )

  .then(function(response) {
    oauthAccessToken = response.access_token;
    chrome.storage.sync.set({oauthAccessToken: oauthAccessToken}, function() {
      console.log('oauth access token saved');
      defer.resolve();
    })
  });

  return defer.promise;
};
