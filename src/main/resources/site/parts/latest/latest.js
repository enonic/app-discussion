var thymeleaf = require("/lib/xp/thymeleaf");
var commentLib = require("/lib/commentManager");
var appersist = require('/lib/openxp/appersist');
var portal = require('/lib/xp/portal');
var tools = require('/lib/tools');

exports.get = function(req) {
    var content = portal.getComponent();
    
    var size = content.config.size;

    var connection = appersist.repository.getConnection();

    //query the 5 latet comments here
    var result = connection.query({
        start: 0,
        count: size,
        query: "type='comment'",
        sort: 'creationDate ASC',
        branch: "master",
    });

    var comments = [];

    for (var i=0; i<result.hits.length; i++) {
        var commentId = result.hits[i].id;
        comments.push(commentLib.getNodeData(connection.get( commentId )));
    }

    var model = {
        comments: comments,
    };

    //todo add link to the given comment
    tools.out(comments);

    var view = resolve("latest.html");

    return {
        body: thymeleaf.render(view, model),
    };
};