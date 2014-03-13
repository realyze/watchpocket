watchpocket = {};
var oauthRequestToken = null;
var oauthAccessToken = null;

watchpocket.post = function (url, data, successHandler, errorHandler) {
  console.log('posting...' + JSON.stringify(arguments));
	var xhr = new XMLHttpRequest();
  xhr.onerror = function() {
 	  if (this.status === 401) {
      console.log('HTTP 401 returned');
 		  watchpocket.getRequestToken();
    }
  };

	xhr.onreadystatechange = function () {
    console.log('ready state change, state:' + this.readyState + ' ' + xhr.status);
		if (xhr.readyState === 4 && xhr.status === 200) {
			if (successHandler) {
				successHandler(this);
			}
		}
		else if (this.readyState === 4 && this.status === 401) {
      console.log('HTTP 401 returned');
			watchpocket.getRequestToken();
		}
	};
  //console.log('POST', url);
	xhr.open('POST', url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
	xhr.setRequestHeader("X-Accept", "application/json");
  console.log('send ' + data);
	xhr.send(data || null);
};

watchpocket.getRequestToken = function() {
	watchpocket.post(
		'https://getpocket.com/v3/oauth/request',
		JSON.stringify({
			'consumer_key' : watchpocket.consumerKey,
			'redirect_uri' : chrome.extension.getURL('auth.html') + '?status=done'
		}),
		function (xhr) {
      console.log('getRequestToken callback');
			var response = JSON.parse(xhr.responseText);
      oauthRequestToken = response.code
			watchpocket.getAuthorization(response.code);
		}
	);
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
      return
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

watchpocket.getAccessToken = function(callback) {
	watchpocket.post(
		'https://getpocket.com/v3/oauth/authorize',
		JSON.stringify({
			'consumer_key' : watchpocket.consumerKey,
			'code'         : oauthRequestToken
		}),
		function (xhr) {
			var response = JSON.parse(xhr.responseText);
			oauthAccessToken = response.access_token;
			if (callback) callback();
		}
	);
};

watchpocket.consumerKey = '24728-3ffcc9d8cd78b7890e28362e';


watchpocket.isLoggedIn = function() {
	return (localStorage.oAuthAccessToken) ? true : false;
};

watchpocket.loadBookmarks = function(el, query, sort, state, callback) {
  console.log('main: loading bookmarks');
	var params = {
		consumer_key: watchpocket.consumerKey,
		access_token: oauthRequestToken
	}
  console.log('1');
	//el.css('opacity', '0.3');
	if (query) {
		params['search'] = query;
	}
  console.log('2');
  if (sort) {
      params['sort'] = sort;
  }
  if (state) {
      params['state'] = state;
  }
  console.log('calling post', params);
	watchpocket.post('https://getpocket.com/v3/get',
		JSON.stringify(params),
		function (xhr) {
      console.log('calling success handler');
			$('h3.bookmarksTitle', el).show();
            $('.bookmarksSort', el).show();
            $('.bookmarksState', el).show();
			$('.bookmarksSearch', el).show();
			var list = JSON.parse(xhr.responseText).list;
			var items = [];
			console.log('list ' + list);
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

      console.log('bookmarks items ' + JSON.stringify(items));
      return callback(null, items);

      //TODO!

			var html = '';
			// Iterate through the reversed items array to get newest items at the top
			$.each(items, function(i, d) {
				var classes = '';
				if (d.favorite === true) {
					classes += 'favorite ';
				}
				if (d.status === 1) {
					classes += 'archived ';
				}
				html += '<tr id="' + d.id + '" rel="tooltip" data-url="' + d.url + '" ' + d.excerpt + ' class="'+ classes +'"><td class="favicon"><img src="' + d.icon + '" /></td>' +
						'<td class="title"><span class="data">' + d.title + '</span><span class="domain">' + d.domain + '</span>' +
					'<span class="actions"><i class="icon-ok"></i><i class="icon-heart"></i><i class="icon-trash"></i></span></td></tr>';
			});
			$('.bookmarksSearch input', el).focus();
			$('tbody', el).html(html);
			el.css('opacity', '1.0');
		}
	);
};

watchpocket.add = function(url) {
	var params = {
		consumer_key: watchpocket.consumerKey,
		access_token: localStorage.oAuthAccessToken,
		url: url
	};
	watchpocket.post('https://ge-tpocket.com/v3/add', JSON.stringify(params), function() {
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
	watchpocket.post('https://getpocket.com/v3/send', JSON.stringify(params));
};

$(function() {
 console.log('main script, creating context menu item');
	chrome.contextMenus.create({
    id: "pocketContextMenu",
		title: 'Add to Pocket',
		contexts : ['all'],
		onclick: function(info, tab) {
			watchpocket.add(tab.url);
		},
    enabled: true
	});

  console.log('main: adding command listener');

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('main: command received ' + request.command);
		if (request.command === 'addBookmark' && request.url) {
			watchpocket.add(request.url);
		} else if (request.command === 'loadBookmarks') {
      console.log('main: loading bookmarks...')
      watchpocket.loadBookmarks(request.query, request.sort, request.state, function(err, items) {
        sendResponse({items: items});
      });
    } else if (request.command === 'getOauthRequestToken') {
      console.log('getOauthRequestToken');
      sendResponse(null, oauthRequestToken);
      return;
    } else if (request.command === 'getOauthAccessToken') {
      console.log('getOauthAccessToken');
      sendResponse(null, oauthAccessToken);
      return;
    } else {
      console.log('unknown command: ' + JSON.stringify(request));
    }
	});
});
