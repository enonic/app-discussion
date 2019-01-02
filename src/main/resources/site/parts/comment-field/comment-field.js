var portal = require("/lib/xp/portal");
var contentLib = require("/lib/xp/content");
var thymeleaf = require("/lib/thymeleaf");
var tools = require("/lib/tools");
var commentLib = require("/lib/commentManager");
var auth = require("/lib/xp/auth");

var i18nLib = require('/lib/xp/i18n');

//TODO rename comment-field to something better
exports.get = function () {
    var content = portal.getContent();

    var discussion = commentLib.getComments(content._id);

    var locale = {
        reply: i18nLib.localize({
            key: "replyMessage",
            locale: content.language,
        }),
        newComment: i18nLib.localize({
            key: "newComment",
            locale: content.language,
        }),
        post: i18nLib.localize({
            key: "post",
            locale: content.language,
        }),
    };

    var model = {
        discussion: discussion,
        currentContent: content._id,
        serviceUrl: portal.serviceUrl({
            service: "communication",
        }),
        userId: auth.getUser().key,
        locale: locale,
    };


    model.render = true;
    if (content.data.commentRemove) {
        model.render = !content.data.commentRemove;
    }

    var view = resolve("comment-field.html");

    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: [
                "<script src='" + portal.assetUrl({ path: "script/lib/jquery-3.3.1.min.js" }) + "'></script>",
            ],
            bodyEnd: [
                "<script src='" + portal.assetUrl({ path: "script/comment-post.js" }) + "'></script>",
            ]
        }
    };
};
