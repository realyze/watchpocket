var watchpocket = watchpocket || {};

var oauthRequestToken = null;
var oauthAccessToken = null;


watchpocket.consumerKey = '24728-3ffcc9d8cd78b7890e28362e';


watchpocket.post = function (url, data) {
  var defer = Q.defer();

  var xhr = new XMLHttpRequest();
  xhr.onerror = function(err) {
    console.log('XMLHttpRequest error: ' + err);
    if (this.status === 401) {
      console.log('HTTP 401 returned');
      watchpocket.getRequestToken();
      defer.reject({code: 401});
    }
  };

  xhr.onreadystatechange = function () {
    console.log('ready state change, state:' + this.readyState + ' ' + xhr.status);
    if (xhr.readyState === 4 && xhr.status === 200) {
      defer.resolve(JSON.parse(xhr.responseText));
    } else if (this.readyState === 4 && this.status === 401) {
      console.log('HTTP 401 returned');
      watchpocket.getRequestToken();
      defer.reject({code: 401});
    }
  };

  xhr.open('POST', url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhr.setRequestHeader("X-Accept", "application/json");
  xhr.send(data || null);

  LOG('HTTP req sent to', url, data);

  return defer.promise;
};


watchpocket.loadBookmarks = function(query, sort, state) {

  var params = {};

  return watchpocket.getOauthAccessToken()
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
    url: url
  };

  return watchpocket.getOauthAccessToken()
    .then(function(oauthAccessToken) {
      params.access_token = oauthAccessToken;
    })
    .then(function() {
      return watchpocket.post('https://getpocket.com/v3/add', JSON.stringify(params));
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
  var addToPocketMenuId = chrome.contextMenus.create({
    id: "pocketContextMenu",
    title: 'Add to Pocket',
    contexts : ['all'],
    enabled: true
  });

  chrome.contextMenus.onClicked.addListener(function(info) {
    if (info.menuItemId !== addToPocketMenuId) {
      return;
    }
    watchpocket.add(info.linkUrl);
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    LOG('main: command received ' + request.command);

    switch (request.command) {

      case 'addBookmark':
        watchpocket.add(request.url).then(function() {
          sendResponse();
        }).done();
        return true;

      case 'loadBookmarks':
        watchpocket.loadBookmarks(request.query, request.sort, request.state)
          .then(function(items) {
            sendResponse(items);
          }, function(err) {
            if (err.code === 401) {
              sendResponse(null);
            }
          })
          .done();
        return true;

      case 'getOauthRequestToken':
        sendResponse(null, oauthRequestToken);
        break;

      case 'getOauthAccessToken':
        watchpocket.getAccessToken()
          .then(function(token) {
            sendResponse(null, token);
          })
         .done();
        return true;

      default:
        console.warn('unknown command: ' + JSON.stringify(request));
        break;
    }
  });
});
