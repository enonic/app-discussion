var commentLib = require("/lib/commentManager");
//var tools = require("/lib/tools");

exports.post = postComment;

function postComment(req) {
    var params = req.params;

    var comment;

    if (params.parent) {
        comment = commentLib.createComment(params.comment, params.content, params.parent);
    }
    else if (params.modify) {
        comment = commentLib.modifyComment(params.id, params.comment);
    }
    else if (params.comment && params.comment.length > 0) {
        comment = commentLib.createComment(params.comment, params.content);
    }
    if (comment == null) {
        log.info("Could not create new comment!\n" + req);
        return null;
    }

    var nodeData = commentLib.getNodeData(comment);

    return {
        body: {
            data: nodeData,
        },
        contentType: 'application/json'
    };
}