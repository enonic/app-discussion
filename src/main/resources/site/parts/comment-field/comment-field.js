var portal = require("/lib/xp/portal");
var contentLib = require("/lib/xp/content");
var thymeleaf = require("/lib/thymeleaf");
var commentLib = require("/lib/commentManager");
var auth = require("/lib/xp/auth");
var i18nLib = require('/lib/xp/i18n');
//var tools = require("/lib/tools");

function createLocalizeParam(word, lang) {
    var obj = {
        key: word,
    };
    if (lang) {
        obj.lang = lang;
    }
    
    return obj;
}

//TODO rename comment-field to something better
exports.get = function (ref) {
    var portalContent = portal.getContent();

    var content = contentLib.get({ key: portalContent._id });
    var langCode = content.language;

    //Lang code is wrongly formated (sometimes)
    langCode = langCode ? langCode.replace(/_/g, '-') : "";

    var discussion = commentLib.getComments(portalContent._id);

    var locale = {
        reply: i18nLib.localize({
            key: "replyMessage" 
        }),
        newComment: i18nLib.localize(
            createLocalizeParam("newComment", langCode)
        ), //|| "Ny kommentar",
        post: i18nLib.localize(createLocalizeParam("post", langCode)),
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

    //log.info(JSON.stringify(locale, null, 2));


    model.render = true;
    if (content.data.commentRemove) {
        model.render = !content.data.commentRemove;
    }

    var view = resolve("comment-field.html");

    var addition = [
        "<script src='" + portal.assetUrl({ path: "script/lib/jquery-3.3.1.min.js" }) + "'></script>",
    ];

    var siteConfig = portal.getSiteConfig();

    if (siteConfig.defaultStyle) {
        addition.push("<link rel='stylesheet' href='" + portal.assetUrl({ path: "css/default.css" }) + "'/>");
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
