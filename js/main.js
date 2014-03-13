watchpocket = {};
var oauthRequestToken = null;
var oauthAccessToken = null;


watchpocket.consumerKey = '24728-3ffcc9d8cd78b7890e28362e';


watchpocket.post = function (url, data) {
  var defer = Q.defer();

	var xhr = new XMLHttpRequest();
  xhr.onerror = function() {
 	  if (this.status === 401) {
      console.log('HTTP 401 returned');
      watchpocket.getRequestToken();
      defer.resolve();
    }
  };

	xhr.onreadystatechange = function () {
    console.log('ready state change, state:' + this.readyState + ' ' + xhr.status);
		if (xhr.readyState === 4 && xhr.status === 200) {
      console.log('xhr response ' + xhr.responseText);
      defer.resolve(JSON.parse(xhr.responseText));
		} else if (this.readyState === 4 && this.status === 401) {
      console.log('HTTP 401 returned');
      watchpocket.getRequestToken();
      defer.resolve();
		}
	};

	xhr.open('POST', url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
	xhr.setRequestHeader("X-Accept", "application/json");
	xhr.send(data || null);

  return defer.promise;
};

watchpocket.getRequestToken = function() {
	return watchpocket.post(
		'https://getpocket.com/v3/oauth/request',
		JSON.stringify({
			'consumer_key' : watchpocket.consumerKey,
			'redirect_uri' : chrome.extension.getURL('auth.html') + '?status=done'
		})
  ).then(function(response) {
    oauthRequestToken = response.code;
		watchpocket.getAuthorization(response.code);
  });
};


var getOauthAccessToken = function() {
  var defer = Q.defer();
  chrome.storage.sync.get('oauthAccessToken', function(items) {
    defer.resolve(items.oauthAccessToken);
  });
  return defer.promise;
};

watchpocket.getAuthorization = function(requestToken) {
	var url = [
		'https://getpocket.com/auth/authorize?request_token=',
		requestToken,
		'&redirect_uri=',
		chrome.extension.getURL('auth.html') + '?status=done'
	].join('');

  chrome.tabs.query({active: true}, function(tabs) {
    if (tabs.length === 0) {
      console.error('no active tab found');
      return;
    }
    chrome.tabs.update(tabs[0].id, {url:url}, function(){
      console.log('updated tab');
    });
  });
  console.log('creating tab: ' + url);
  // TODO: Not implemented in KITT!
  // use `chrome.tabs.update(tab.id, {url: result.Name}, function(){...});`
  // see GestureToLocation popup.js getActiveTab
  // chrome.tabs.query({active: true}, ...) to get tab.id
	//chrome.tabs.create({url: url});
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

var newestSort = function(a, b) {
  var aTime = parseInt(a.added);
  var bTime = parseInt(b.added);
  if (aTime < bTime)
    return 1;
  if (aTime > bTime)
    return -1;
  return 0;
};

var oldestSort = function(a, b) {
  var aTime = parseInt(a.added);
  var bTime = parseInt(b.added);
  if (aTime < bTime)
    return -1;
  if (aTime > bTime)
    return 1;
  return 0;
};

var titleSort = function(a, b) {
  if (a.title < b.title)
    return -1;
  if (a.title > b.title)
    return 1;
  return 0;
};

var siteSort = function(a, b) {
  if (a.domain < b.domain)
    return -1;
  if (a.domain > b.domain)
    return 1;
  return 0;
};

watchpocket.loadBookmarks = function(query, sort, state) {

  var params = {};

  return getOauthAccessToken()
    .then(function(token) {
      params = {
        consumer_key: watchpocket.consumerKey,
        access_token: token
      }
      if (query) {
        params['search'] = query;
      }
      if (sort) {
        params['sort'] = sort;
      }
      if (state) {
        params['state'] = state;
      }
    })

    .then(function() {
      return watchpocket.post(
        'https://getpocket.com/v3/get', JSON.stringify(params)
      );
    })

    .then(function(response) {
      console.log('calling success handler');
      console.log('list loaded: ' + response);

      var list = response.list;
      var items = [];

      $.each(list, function(i, d) {
        // Real URL is preferably the resolved URL but could be the given URL
        var realURL = d.resolved_url || d.given_url;
        // If neither resolved or given URL the item isn't worthwhile showing
        if (realURL) {
          var id = d.item_id;
          // Regular expression to parse out the domain name of the URL, or an empty string if something fails
          var domain = realURL.match(/^((http[s]?|ftp):\/)?\/?([^:\/\s]+)(:([^\/]*))?/i)[3] || '';
          // Fetches a icon from a great webservice which provides a default fallback icon
          var icon = 'https://web-image.appspot.com/?url=' + realURL;
                    //var icon = 'img/icon.png';
          // Show the shortened excerpt as a tooltip
          var excerpt = '';
          if (d.excerpt) {
            excerpt = 'data-original-title="' + d.excerpt.substr(0, 120) + '..."';
          }
          // Create a data object and push it to the items array
          items.push({
            id: id,
            url: realURL,
            title: d.resolved_title || d.given_title,
            excerpt: excerpt,
            icon: icon,
            domain: domain,
            added: d.time_added,
            favorite: (parseInt(d.favorite) === 1),
            status: parseInt(d.status)
          });
        }
      });

      if (params.sort === 'oldest') {
        items = items.sort(oldestSort);
      }
      else if (params.sort === 'title') {
        items = items.sort(titleSort);
      }
      else if (params.sort === 'site') {
        items = items.sort(siteSort);
      }
      else {
        items = items.sort(newestSort);
      }

      return items;
    });
};

watchpocket.add = function(url) {
	var params = {
		consumer_key: watchpocket.consumerKey,
		access_token: localStorage.oAuthAccessToken,
		url: url
	};
	return watchpocket.post('https://ge-tpocket.com/v3/add', JSON.stringify(params))
    .then(function() {
    //TODO: THIS IS NOT SUPPORTED IN KITT!
		chrome.tabs.executeScript(null, {code:"showBookmarkMessage();"});
	});
};

watchpocket.send = function(method, id) {
	var params = {
		consumer_key: watchpocket.consumerKey,
		access_token: localStorage.oAuthAccessToken,
		actions: [{'action': method, 'item_id': id}]
	};
	return watchpocket.post('https://getpocket.com/v3/send', JSON.stringify(params));
};

$(function() {
	chrome.contextMenus.create({
    id: "pocketContextMenu",
		title: 'Add to Pocket',
		contexts : ['all'],
		onclick: function(info, tab) {
			watchpocket.add(tab.url);
		},
    enabled: true
	});

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('main: command received ' + request.command);
		if (request.command === 'addBookmark' && request.url) {
			watchpocket.add(request.url);
		} else if (request.command === 'loadBookmarks') {
      console.log('main: loading bookmarks...')
      watchpocket.loadBookmarks(request.query, request.sort, request.state)
        .then(function(items) {
          console.log('returning items ' + items);
          sendResponse(items);
        });
      return true;
    } else if (request.command === 'getOauthRequestToken') {
      console.log('getOauthRequestToken');
      sendResponse(null, oauthRequestToken);
    } else if (request.command === 'getOauthAccessToken') {
      console.log('getOauthAccessToken');
      watchpocket.getAccessToken(function() {
        sendResponse(null);
      });
      return true;
    } else {
      console.log('unknown command: ' + JSON.stringify(request));
    }
	});
});
