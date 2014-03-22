var sort = 'newest';
var state = 'unread';

var localJQuery = $.noConflict(true);
(function($) {

  angular.module('watchpocket', [
    'angularSpinner',
    'truncate',
    'infinite-scroll'
  ])

  .directive('ladda', function(){
    return {
      restrict: 'A',
      link : function(scope, element, attrs){
        var l = Ladda.create($(element).get(0));
        scope.$watch(attrs.ladda, function(newVal, oldVal) {
          console.log('ladda: ' + newVal);
          if (newVal !== undefined) {
            if(newVal) {
              l.start();
            } else {
              l.stop();
            }
          }
        });
      }
    };
  })

  .controller('bookmarksCtrl', function($scope, usSpinnerService) {
    var offset = 0;
    var count = 20;

    $scope.bookmarks = [];

    $scope.$watch('bookmarks', function(newVal, oldVal) {
      usSpinnerService.stop('spinner-bookmarks');
    });


    $scope.loadNextPage = function() {
      loadBookmarks({offset: offset, count: count});
    }

    $scope.$watch('searchText', function(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        console.log('searching for: ' + newVal);
        offset = 0;
        $scope.loadNextPage();
      }
    });

    var loadBookmarks = function(opts) {
      chrome.runtime.sendMessage(null, {
        command: "loadBookmarks",
        query: null,
        sort: sort,
        state: state,
        search: $scope.searchText,
        offset: opts.offset,
        count: opts.count
      }, function(bookmarks) {
        if ( ! bookmarks) {
          window.close();
          return;
        }
        usSpinnerService.spin('spinner-bookmarks');
        if (offset === 0) {
          $scope.bookmarks = []
        }
        $scope.bookmarks = _.union($scope.bookmarks, bookmarks);
        offset += count;
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
      $scope.bookmarkAddingInProgress = true;

      getActiveTab().then(function(tab) {
        chrome.runtime.sendMessage(null, {
          command: 'addBookmark',
          url: tab.url
        }, function() {
          $scope.bookmarkAddingInProgress = false;
          loadBookmarks();
        });
      });
    };

  });

})(localJQuery);
