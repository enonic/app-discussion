var portal = require("/lib/xp/portal");
var contentLib = require("/lib/xp/content");
var thymeleaf = require("/lib/xp/thymeleaf");
var tool = require("/lib/tools");
var commentLib = require("/lib/commentManager");

//TODO rename comment-field to something better 
exports.get = function () {
    //connect to repo: app.name and its master branch.
    //var repoConnection = appersist.repository.getConnection();
    var content = portal.getContent();

    //createTestComments(repoConnection);
    var discussion = commentLib.getComments(content._id);

    var model = {
        discussion: discussion,
        currentContent: content._id,
        serviceUrl: portal.serviceUrl({
            service: "communication",
        }),
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