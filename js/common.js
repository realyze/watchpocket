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

var getActiveTab = function() {
  var defer = Q.defer();

  chrome.tabs.query({active: true}, function(tabs) {
    if (tabs.length === 0) {
      console.error('no active tab found');
      return defer.reject();
    }
    return defer.resolve(tabs[0]);
  });

  return defer.promise;
};

var LOG = function() {
  res = "";
  for(i=0; i<arguments.length; ++i) {
    if (typeof(arguments[i]) === 'string' || typeof(arguments[i]) === 'function') {
      res += arguments[i] + ' ';
    } else {
      res += JSON.stringify(arguments[i], null, 2) + ' ';
    }
  }
  console.log(res);
};

