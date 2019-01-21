var thymeleaf = require("/lib/thymeleaf");
var commentLib = require("/lib/commentManager");
var contentLib = require("/lib/xp/content");
var appersist = require('/lib/openxp/appersist');
var portal = require('/lib/xp/portal');
var tools = require('/lib/tools');
var i18n = require('/lib/xp/i18n');

exports.get = function (req) {
    var content = portal.getComponent();

    var siteContent = portal.getContent();

    var size = content.config.size;
    var headline = content.config.headline;
    var langCode = siteContent.language;

    if (langCode)
        langCode = langCode.replace(/_/g, '-'); //replace all underscore with dash

    var connection = appersist.repository.getConnection();

    //query the latest comments here
    var result = connection.query({
        start: 0,
        count: size,
        query: "",
        sort: 'creationTime DESC',
        branch: "master",
        filters: {
            boolean: {
                must: [
                    {
                        exists: {
                            field: "type",
                            values: ["comment"],
                        }
                    },
                    {
                        exists: {
                            field: "content",
                        }
                    }
                ],
            },
        },
    });

    var comments = [];

    for (var i = 0; i < result.hits.length; i++) {
        var commentId = result.hits[i].id;
        var node = connection.get(commentId);

        var nodeContext = contentLib.get({ key: node.content });
        //If content is deleted we cant use it.
        if (!nodeContext) { 
            comments[i] = null;
            break;
        }
        comments[i] = commentLib.getNodeData(node);
        comments[i].contentUrl = portal.pageUrl({ id: node.content });
        comments[i].contentName = contentLib.get({ key: node.content }).displayName;
        comments[i].text = portal.sanitizeHtml(comments[i].text);
    }

    var on = i18n.localize({
        key: "on",
        local: langCode,
    });

    var model = {
        comments: comments,
        headline: headline,
        local: { on: on },
    };

    var view = resolve("latest.html");

    var addition = [];
    var siteConfig = portal.getSiteConfig();

    if (siteConfig.defaultStyle) {
        addition.push("<link rel='stylesheet' href='"+ portal.assetUrl({ path: "css/default.css" }) + "'/>");
    }

    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: addition,
        }
    };
};
