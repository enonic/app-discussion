var portal = require("/lib/xp/portal");
var contentLib = require("/lib/xp/content");
var thymeleaf = require("/lib/thymeleaf");
var tools = require("/lib/tools");
var commentLib = require("/lib/commentManager");
var auth = require("/lib/xp/auth");
var adminLib = require('/lib/xp/admin');
var i18nLib = require('/lib/xp/i18n');

//TODO rename comment-field to something better
exports.get = function (ref) {
    var portalContent = portal.getContent();

    var content = contentLib.get({key: portalContent._id});
    var langCode = content.language;

    //Lang code is wrongly formated (sometimes)
    langCode = langCode ? langCode.replace(/_/g, '-') : "";

    var discussion = commentLib.getComments(portalContent._id);

    var locale = {
        reply: i18nLib.localize({
            key: "replyMessage",
            locale: langCode,
        }),
        newComment: i18nLib.localize({
            key: "newComment",
            locale: langCode,
        }),
        post: i18nLib.localize({
            key: "post",
            locale: langCode,
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

    var addition = [
        "<script src='" + portal.assetUrl({ path: "script/lib/jquery-3.3.1.min.js" }) + "'></script>",
    ];

    var siteConfig = portal.getSiteConfig();

    // log.info(JSON.stringify(siteConfig, null, 2));

    if (siteConfig.defaultStyle) {
        addition.push("<link rel='stylesheet' href='"+ portal.assetUrl({ path: "css/default.css" }) + "'/>");
    }

    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: addition,
            bodyEnd: [
                "<script src='" + portal.assetUrl({ path: "script/comment-post.js" }) + "'></script>",
            ]
        }
    };
};
