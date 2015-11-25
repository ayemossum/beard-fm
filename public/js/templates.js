function addmedia(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (button) {
buf.push("<div class=\"close-button fa fa-close\"></div><div class=\"searchbox\"><input class=\"media-search\"/><button" + (jade.attr("type", button, true, false)) + " class=\"media-search-button\">Search</button></div><div class=\"resultsbox\">No Results</div>");}.call(this,"button" in locals_for_with?locals_for_with.button:typeof button!=="undefined"?button:undefined));;return buf.join("");
}
function chat(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<input maxlength=\"90\" class=\"chat-input\"/><button type=\"button\" class=\"chat-send\">Send</button>");;return buf.join("");
}
function chatbox(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"chat-members\"></div><div class=\"chat-messages\"><div class=\"chat-table\"></div></div><div class=\"chat-entry\"><input maxlength=\"90\" class=\"chat-input\"/><button type=\"button\" class=\"chat-send\">Send</button></div>");;return buf.join("");
}
function chatmembers(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (undefined, userId, users) {
buf.push("<ul class=\"chat-members-list\">");
// iterate users
;(function(){
  var $$obj = users;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var user = $$obj[$index];

if ( !user.disconnected)
{
buf.push("<li" + (jade.attr("data-user-id", user.userId, true, false)) + (jade.cls(["chat-member"+(userId==user.userId ? " current-user" : "")], [true])) + ">" + (jade.escape(null == (jade_interp = user.userName) ? "" : jade_interp)) + "</li>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var user = $$obj[$index];

if ( !user.disconnected)
{
buf.push("<li" + (jade.attr("data-user-id", user.userId, true, false)) + (jade.cls(["chat-member"+(userId==user.userId ? " current-user" : "")], [true])) + ">" + (jade.escape(null == (jade_interp = user.userName) ? "" : jade_interp)) + "</li>");
}
    }

  }
}).call(this);

buf.push("</ul>");}.call(this,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined,"userId" in locals_for_with?locals_for_with.userId:typeof userId!=="undefined"?userId:undefined,"users" in locals_for_with?locals_for_with.users:typeof users!=="undefined"?users:undefined));;return buf.join("");
}
function chatmessage(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (authorId, message, ts, users) {
buf.push("<div" + (jade.attr("data-user-id", authorId, true, false)) + (jade.cls(['chat-message',users[authorId].disconnected ? 'disconnected' : ''], [null,true])) + ">");
if ( message.substr(0,3)=='/me')
{
buf.push("<div class=\"td\"></div><div class=\"td\"><div class=\"message-text me\"><span class=\"author\">" + (jade.escape(null == (jade_interp = users[authorId].userName) ? "" : jade_interp)) + "</span>" + (((jade_interp = message.replace(/\/me/,'')) == null ? '' : jade_interp)) + "</div></div>");
}
else
{
buf.push("<div class=\"td username\"><div class=\"author\">" + (jade.escape(null == (jade_interp = users[authorId].userName) ? "" : jade_interp)) + "</div></div><div class=\"td\"><div class=\"message-text\">" + (((jade_interp = message) == null ? '' : jade_interp)) + "</div></div>");
}
buf.push("<div class=\"td ts\">" + (jade.escape(null == (jade_interp = ts) ? "" : jade_interp)) + "</div></div>");}.call(this,"authorId" in locals_for_with?locals_for_with.authorId:typeof authorId!=="undefined"?authorId:undefined,"message" in locals_for_with?locals_for_with.message:typeof message!=="undefined"?message:undefined,"ts" in locals_for_with?locals_for_with.ts:typeof ts!=="undefined"?ts:undefined,"users" in locals_for_with?locals_for_with.users:typeof users!=="undefined"?users:undefined));;return buf.join("");
}
function footer(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<footer><div class=\"align-center powered-by\">" + (jade.escape(null == (jade_interp = "Powered by beard") ? "" : jade_interp)) + "</div></footer>");;return buf.join("");
}
function media(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (media, undefined) {
buf.push("<div class=\"media-box\"><div id=\"player\" class=\"player\"></div><div class=\"controls\"><div class=\"control vote-down fa fa-chevron-down\"></div><div class=\"text\">vote</div><div class=\"control vote-up fa fa-chevron-up\"></div><div class=\"control volume\"><div class=\"muting fa fa-volume-up\"></div><input type=\"range\" min=\"0\" max=\"100\" value=\"90\"/></div></div></div><div class=\"media-list\">");
if ( media)
{
buf.push("<ol class=\"media-queue\">");
// iterate media
;(function(){
  var $$obj = media;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var item = $$obj[$index];

buf.push("<li" + (jade.attr("data-user-id", item.userId, true, false)) + (jade.attr("data-video-id", item.videoId, true, false)) + " class=\"media\">" + (jade.escape(null == (jade_interp = item.title) ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var item = $$obj[$index];

buf.push("<li" + (jade.attr("data-user-id", item.userId, true, false)) + (jade.attr("data-video-id", item.videoId, true, false)) + " class=\"media\">" + (jade.escape(null == (jade_interp = item.title) ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

buf.push("</ol>");
}
buf.push("</div>");}.call(this,"media" in locals_for_with?locals_for_with.media:typeof media!=="undefined"?media:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
}
function medialist(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (media, undefined) {
if ( media)
{
buf.push("<ol class=\"media-queue\">");
// iterate media
;(function(){
  var $$obj = media;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var item = $$obj[$index];

buf.push("<li" + (jade.attr("data-user-id", item.userId, true, false)) + (jade.attr("data-video-id", item.videoId, true, false)) + " class=\"media\">" + (jade.escape(null == (jade_interp = item.title) ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var item = $$obj[$index];

buf.push("<li" + (jade.attr("data-user-id", item.userId, true, false)) + (jade.attr("data-video-id", item.videoId, true, false)) + " class=\"media\">" + (jade.escape(null == (jade_interp = item.title) ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

buf.push("</ol>");
}}.call(this,"media" in locals_for_with?locals_for_with.media:typeof media!=="undefined"?media:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
}
function register(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (button) {
buf.push("<div class=\"register-box\"><div class=\"register-header\">Please enter your user name:</div><input class=\"user-name\"/><button" + (jade.attr("type", button, true, false)) + " class=\"user-name-button\">enter</button></div>");}.call(this,"button" in locals_for_with?locals_for_with.button:typeof button!=="undefined"?button:undefined));;return buf.join("");
}
function searchresults(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (items, undefined) {
buf.push("<ul class=\"search-results\">");
// iterate items
;(function(){
  var $$obj = items;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var video = $$obj[$index];

buf.push("<li" + (jade.attr("data-title", video.snippet.title, true, false)) + (jade.attr("data-video-id", video.id.videoId, true, false)) + (jade.attr("data-thumb", video.snippet.thumbnails.default.url, true, false)) + " class=\"video-result\"><img" + (jade.attr("src", video.snippet.thumbnails.default.url, true, false)) + " class=\"video-thumb\"/><div class=\"video-title\">" + (jade.escape(null == (jade_interp = video.snippet.title) ? "" : jade_interp)) + "</div></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var video = $$obj[$index];

buf.push("<li" + (jade.attr("data-title", video.snippet.title, true, false)) + (jade.attr("data-video-id", video.id.videoId, true, false)) + (jade.attr("data-thumb", video.snippet.thumbnails.default.url, true, false)) + " class=\"video-result\"><img" + (jade.attr("src", video.snippet.thumbnails.default.url, true, false)) + " class=\"video-thumb\"/><div class=\"video-title\">" + (jade.escape(null == (jade_interp = video.snippet.title) ? "" : jade_interp)) + "</div></li>");
    }

  }
}).call(this);

buf.push("</ul>");}.call(this,"items" in locals_for_with?locals_for_with.items:typeof items!=="undefined"?items:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
}
function youtube(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

;return buf.join("");
}