watchpocket = window.watchpocket || chrome.extension.getBackgroundPage().watchpocket;

var sort = 'newest';
var state = 'unread';

function search() {
	watchpocket.loadBookmarks($('#bookmarks'), $('.bookmarksSearch input').val(), sort, state);
}

$(function() {
	search();
    $('#bookmarks').on('click', 'tr', function(e) {
        var $this = $(this);
        var target = $(e.target);
        var id = parseInt($this.attr('id'));
        var $tooltip = $('.tooltip');
        if (target.hasClass('icon-trash')) {
            watchpocket.send('delete', id);
			$tooltip.remove();
            $this.remove();
        }
        else if (target.hasClass('icon-ok')) {
            watchpocket.send('archive', id);
            if (state === 'unread') {
				$tooltip.remove();
                $this.remove();
            }
        }
        else if (target.hasClass('icon-heart')) {
			if (!$this.hasClass('favorite')) {
				watchpocket.send('favorite', id);
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
});
