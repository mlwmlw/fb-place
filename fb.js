var req = require('request');
var cheerio = require('cheerio');
var road = process.argv[3];
var name = encodeURIComponent(process.argv[2]);

var http = require('http');
var server = http.createServer(function(req, res) {
	var m;
	if(m = req.url.match(/^\/query\/(.+)$/)) {
		query(m[1], function(r) {
			res.write(JSON.stringify(r));
			res.end();
		})
	}
	else {
		res.end('error');
	}
});
server.listen(8080);
/*query(name, function(result) {
	console.log(result);
});*/
function query(name, success) {
	request("https://zh-tw.facebook.com/search.php?o=274&init=dir&q=" + name, function(body) {
		var $ = cheerio.load(body);
		var result = [];
		$('#pagelet_search_results .mbm').each(function() {
			var name = $('a', this).text();
			var page = $('a', this).attr('href');
			var $content = $('.fsm div > .fsm', this);
			var address = $content.eq(0).text();
			var category = $content.eq(1).text();
			var fb = $content.eq(2).text().match(/([\d,]+)/g);
			if(fb) {
				var check = fb[0].replace(',', '');
				var like = fb[1].replace(',', '');
			}
			if(!road || same_road(address, road)) {
				result.push({
					name: name,
					fans_page: page,
					address: address,
					category: category,
					check: check,
					like: like
				});
			}
		});
		result.sort(function(a, b) {
			return b.like - a.like;
		});
		if(result.length == 0) {
			return {};
		}
		result = result[0];
		request(result.fans_page + "/info?tab=overview", function(content) {
			var $ = cheerio.load(content);
			var m = $('body').html().match(/<!--(.+)-->/g);
			if(m.length < 2)
				return success(result);
			$ = cheerio.load(m[2].replace(/<!--|-->/g, ''));
			var map = {"電子郵件": "email", "網站": "website", "價格範圍": "price", "詳細說明": "full_desc", "簡短說明": "short_desc", "營業時間": "hours"}; 
			$('.uiList li').each(function() {
				var $col = $('._50f4', this);
				var key = $col.eq(0).text();
				if(!map[key])
					return;
				key = map[key]; 
				result[key] = $col.eq(1).text();
			});
			success(result);
		});
	});
}

function same_road(a, b) {
	a = a.split(/[市區道路街鄉段巷弄號]/);
	b = b.split(/[市區道路街鄉段巷弄號]/);
	return a[1] == b[1];
}
function request(url, cb) {
	req.get({
			url: url, 
			headers: {
				//'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53'
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.94 Safari/537.36'
			}
	}, function(err, res, body) {
		if(!err)
			cb(body);
		else
			console.log(err);
	});
}
