var sort = 'newest';
var state = 'unread';

var localJQuery = $.noConflict(true);
(function($) {

  angular.module('watchpocket', [
    'ionic',
    'truncate',
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

  .controller('bookmarksCtrl', function($scope, $ionicLoading) {
    var offset = 0;
    var count = 20;

    console.log('controller');

    $scope.bookmarks = [];
    $scope.allResultsFetched = false;

    $scope.$watch('bookmarks', function(newVal, oldVal) {
      if (newVal !== oldVal && newVal === []) {
        $scope.allResultsFetched = false;
        offset = 0;
        $scope.loadNextPage();
      }
    }, true);

    $scope.loadNextPage = function() {
      loadBookmarks({offset: offset, count: count});
    }

    $scope.$watch('searchText', function(newVal, oldVal) {
      if (newVal !== oldVal) {
        offset = 0;
        $scope.bookmarks = []
        $scope.loadNextPage();
      }
    });

    var loadBookmarks = function(opts) {
      console.log('reuest bookmarks');
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
        if (offset === 0) {
          $scope.bookmarks = []
        }
        $scope.bookmarks = _.union($scope.bookmarks, bookmarks);
        offset += count;
        if (bookmarks.length === 0) {
          $scope.allResultsFetched = true;
        }
        $scope.$apply();
        $scope.$broadcast('scroll.infiniteScrollComplete');
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
      getActiveTab().then(function(tab) {
        chrome.runtime.sendMessage(null, {
          command: 'addBookmark',
          url: tab.url
        }, function() {
          window.close();
          $scope.$apply();
        });
      });
    };

    //$scope.loadNextPage();

  });

})(localJQuery);
