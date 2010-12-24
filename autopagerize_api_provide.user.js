// ==UserScript==
// @name           AutoPagerize API Provider in Hatena Bookmark
// @namespace      http://d.hatena.ne.jp/kurumigi/
// @description    Provide APIs compatible with "AutoPagerize" in Hatena Bookmark
// @include        http://b.hatena.ne.jp/*/*
// @include        http://b.hatena.ne.jp/search?*
// ==/UserScript==

(function() {
	var DEBUG = true;
	
	var SITEINFO = [
		// Hatena Bookmark (Search result)
		{
			url:             '^http://b\\.hatena\\.ne\\.jp/search\\?',
			pageElement:     'res',
			targetClassName: 'search-result-list',
			nextLink:        '//div[contains(concat(" ", @class, " "), " pager-autopagerize ")][last()]//a[last()]',
			toggle:          '//div[contains(concat(" ", @class, " "), " pager-autopagerize ")]//img[@class="pointer"]',
		},
		// Hatena Bookmark (Tag page / Keyword page / Local page / Hotentry page / ASIN page / Video page)
		{
			url:             '^http://b\\.hatena\\.ne\\.jp/(?:(?:t|keyword|location|entrylist)/|(?:entrylist|asin|video)(?:\\?|$))',
			pageElement:     'main',
			targetClassName: '(?:hotentry|videolist)',
			nextLink:        '//div[contains(concat(" ", @class, " "), " pager-autopagerize ")][last()]//a[last()]',
			toggle:          '//div[contains(concat(" ", @class, " "), " pager-autopagerize ")]//img[@class="pointer"]',
		},
		// Hatena Bookmark (User page)
		{
			url:             '^http://b\\.hatena\\.ne\\.jp/',
			pageElement:     'hatena-body',
			targetClassName: 'bookmarked_user',
			nextLink:        '//div[contains(concat(" ", @class, " "), " pager-autopagerize ")][last()]//a[last()]',
			toggle:          '//div[contains(concat(" ", @class, " "), " pager-autopagerize ")]//img[@class="pointer"]',
		},
		// Twitter
		{
			url:             '^https?://twitter\\.com/',
			pageElement:     'page-container',
			targetClassName: '(?:stream-item|component)',
		},
	];

	// set event listeners
	function addEventListeners(siteinfo) {
		var filters = [];
		var docFilters = [];

		var pageElement = document.getElementById(siteinfo['pageElement']);

		if (pageElement) {
			// DOMNodeInserted event
			pageElement.addEventListener('DOMNodeInserted',function(evt) {
				if (evt.target.className.match('\\b' + siteinfo['targetClassName'] + '\\b')) {
					// Target is parent node of the added node.
					var targetNode = evt.target;
					var parentNode = evt.relatedNode;

					// Get next page URL.
					var insertedURL = '';
					if (siteinfo['nextLink']) {
						insertedURL = document.evaluate(siteinfo['nextLink'], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href;
					}

					// Apply document filters
					docFilters.forEach(function(f) { f(targetNode, insertedURL, {}) });

					// Dispatch 'AutoPagerize_DOMNodeInserted' event
					var ev1 = document.createEvent('MutationEvent');
					ev1.initMutationEvent('AutoPagerize_DOMNodeInserted', true, false, parentNode, null, insertedURL, null, null);
					targetNode.dispatchEvent(ev1);

					// Apply filters
					filters.forEach(function(f) { f([targetNode]) });

					// Dispatch 'GM_AutoPagerizeNextPageLoaded' event
					var ev2 = document.createEvent('Event');
					ev2.initEvent('GM_AutoPagerizeNextPageLoaded', true, false);
					document.dispatchEvent(ev2);
				}
			}, false);

			// AutoPagerizeToggleRequest event
			if (siteinfo['toggle']) {
				document.addEventListener('AutoPagerizeToggleRequest', function(evt) {
					var toggle = document.evaluate(siteinfo['toggle'], document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

					var ev3 = document.createEvent('Event');
					ev3.initEvent('click', true, false);
					toggle.dispatchEvent(ev3);
				}, false)
			}
			

			// AutoPagerize APIs
			window.AutoPagerize = {};
			window.AutoPagerize.addFilter = function(f) {
				if (DEBUG) { GM_log('Push filters : ' + (f.name ? f.name : f.toString().replace(/\s+/g,' '))); }
				filters.push(f);
			}
			window.AutoPagerize.addDocumentFilter = function(f) {
				if (DEBUG) { GM_log('Push document filters : ' + (f.name ? f.name : f.toString().replace(/\s+/g,' '))); }
				docFilters.push(f);
			}

			// Dispatch 'GM_AutoPagerizeLoaded' event
			var ev4 = document.createEvent('Event')
			ev4.initEvent('GM_AutoPagerizeLoaded', true, false)
			document.dispatchEvent(ev4)
		}
	}
	
	function launchAutoPager(siteinfo) {
		if (siteinfo.length > 0) {
			for (var i = 0; i < siteinfo.length; i++) {
				if (location.href.match(siteinfo[i]['url'])) {
					if (DEBUG) { GM_log("SITEINFO : " + siteinfo[i]['url']); }
					addEventListeners(siteinfo[i]);
					break;
				}
			}
		}
	}
	
	launchAutoPager(SITEINFO);
})();
