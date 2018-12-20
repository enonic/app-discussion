//var tool = require("/lib/tools");
//var contentLib = require("/lib/xp/content");
//var auth = require ("/lib/xp/auth");
var commentLib = require("/lib/commentManager");
//var portal = require("/lib/xp/portal");

exports.post = postComment;

function postComment(req) {
    var params = req.params;

    var comment;
    if (params.parent) {
        comment = commentLib.createComment(params.comment, params.content, params.parent);
    } else {
        comment = commentLib.createComment(params.comment, params.content);
    }
    if (comment == null) {
        //Something went wrong in commentManger (it logs allready)
        return false;
    }

    return true;
}