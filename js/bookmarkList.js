var sort = 'newest';
var state = 'unread';

var localJQuery = $.noConflict(true);
(function($) {

  angular.module('watchpocket', [])

  .controller('bookmarksCtrl', function($scope) {
    $scope.bookmarks = [];

    search(function(err, bookmarks) {
      console.log('bookmarks loaded');
      $scope.bookmarks = bookmarks;
      $scope.$apply();
    });

    $scope.bookmarkSelected = function(item) {
      window.close();
    };
  });

  var search = function(callback) {
    console.log('calling search...');
    chrome.runtime.sendMessage(null, {
        command: "loadBookmarks",
        query: null, //$('.bookmarksSearch input').val(),
        sort: sort,
        state: state
      }, function(response) {
        console.log('search response ' + response);
        callback(null, response);
    });
    console.log('called search');
  }
  /*
  //$(function() {
    //search(function(err, items) {
     // console.log('items' + items);
      var html = '';

      var el = $('#bookmarks');
      console.log('el: ' + el.length);

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
      console.log('html ' + html);
      $('.bookmarksSearch input', el).focus();
      $('tbody', el).html(html);
      el.css('opacity', '1.0');
    });
  */
      $('#bookmarks').on('click', 'tr', function(e) {
          var $this = $(this);
          var target = $(e.target);
          var id = parseInt($this.attr('id'));
          $('.tooltip').remove();
          if (target.hasClass('icon-trash')) {
              watchpocket.send('delete', id);
              $this.remove();
          }
          else if (target.hasClass('icon-ok')) {
        if (!$this.hasClass('archived')) {
          $this.addClass('archived');
          watchpocket.send('archive', id);
          if (state === 'unread') {
            $this.remove();
          }
        }
              else {
          $this.removeClass('archived');
          watchpocket.send('readd', id);
          if (state === 'archive') {
            $this.remove();
          }
        }
          }
          else if (target.hasClass('icon-heart')) {
        if (!$this.hasClass('favorite')) {
          watchpocket.send('favorite', id);
          $this.addClass('favorite');
        }
        else {
          watchpocket.send('unfavorite', id);
          $this.removeClass('favorite');
        }
          }
          else {
              chrome.tabs.create({url: $this.data('url')});
          }
    });
    $('.bookmarksSearch button').click(function() {
      search();
    });
    $('.bookmarksSearch input').keydown(function(e) {
      if (e.keyCode == '13') {
        search();
      }
    });
      $('.bookmarksSort button').click(function(){
          sort = $(this).attr('value');
          search();
      });
      $('.bookmarksState button').click(function(){
          state = $(this).attr('value');
          search();
      });
    $('body').tooltip({
          selector: "[rel=tooltip]",
          placement: 'top'
      });
      if (chrome.time) {
          setInterval(function() {
              chrome.time.getTime("%d/%m/%Y %H:%M", function(d) {
                  $("#time").html(d.timeString);
              });
          }, 1000);
      }
})(localJQuery);
