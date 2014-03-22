var sort = 'newest';
var state = 'unread';

var localJQuery = $.noConflict(true);
(function($) {

  angular.module('watchpocket', [
    'angularSpinner'
  ])

  .controller('bookmarksCtrl', function($scope, usSpinnerService) {
    $scope.bookmarks = [];

    $scope.$watch('bookmarks', function(newVal, oldVal) {
      usSpinnerService.stop('spinner-bookmarks');
    });

    var loadBookmarks = function() {
      LOG('loading bookmarks');
      $scope.bookmarks = [];

      chrome.runtime.sendMessage(null, {
        command: "loadBookmarks",
        query: null,
        sort: sort,
        state: state
      }, function(bookmarks) {
        if ( ! bookmarks) {
          window.close();
          return;
        }
        usSpinnerService.spin('spinner-bookmarks');
        $scope.bookmarks = bookmarks;
        $scope.$apply();
      });
    };

    $scope.bookmarkSelected = function(item) {
      getActiveTab().then(function(tab) {
        chrome.tabs.update(tab.id, {url:item.url}, function(){
          console.log('going to: ' + item.url);
          window.close();
        });
      });
    };

    $scope.addCurrent = function() {
      usSpinnerService.spin('spinner-add');
      getActiveTab().then(function(tab) {
        LOG('adding bookmark', tab);
        chrome.runtime.sendMessage(null, {
          command: 'addBookmark',
          url: tab.url
        }, function() {
          usSpinnerService.stop('spinner-add');
          loadBookmarks();
        });
      });
    };

    // Init!

    loadBookmarks();

  });

})(localJQuery);
