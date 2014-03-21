var sort = 'newest';
var state = 'unread';

var localJQuery = $.noConflict(true);
(function($) {

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

  angular.module('watchpocket', [
    'angularSpinner'
  ])

  .controller('bookmarksCtrl', function($scope, usSpinnerService) {
    $scope.bookmarks = [];

    $scope.$watch('bookmarks', function(newVal, oldVal) {
      usSpinnerService.stop('spinner-bookmarks');
    });

    search(function(bookmarks) {
      if ( ! bookmarks) {
        window.close();
        return;
      }
      usSpinnerService.spin('spinner-bookmarks');
      $scope.bookmarks = bookmarks;
      $scope.$apply();
    });

    $scope.bookmarkSelected = function(item) {
      chrome.tabs.query({active: true}, function(tabs) {
        if (tabs.length === 0) {
          console.error('no active tab found');
          return;
        }
        chrome.tabs.update(tabs[0].id, {url:item.url}, function(){
          console.log('going to: ' + item.url)
          window.close();
        });
      });
    };
  });

  var search = function(callback) {
    chrome.runtime.sendMessage(null, {
        command: "loadBookmarks",
        query: null,
        sort: sort,
        state: state
      }, function(response) {
        callback(response);
    });
  }

})(localJQuery);
