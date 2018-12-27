var tools = require("/lib/tools");
//var contentLib = require("/lib/xp/content");
//var auth = require ("/lib/xp/auth");
var commentLib = require("/lib/commentManager");
//var portal = require("/lib/xp/portal");

exports.post = postComment;

function postComment(req) {
    var params = req.params;

    var comment;
    //try {
        if (params.parent) {
            comment = commentLib.createComment(params.comment, params.content, params.parent);
        }
        else if (params.modify) {
            comment = commentLib.modifyComment(params.id, params.comment);
        }
        else {
            comment = commentLib.createComment(params.comment, params.content);
        }
        if (comment == null) {
            //Something went wrong in commentManger (it logs allready)
            return false;
        }
    /*}
    catch (e) {
        log.info("Service \"Communication\" error. \n " + e);
        return false;
    }*/

    var nodeData = commentLib.getNodeData(comment);

    return {
      body: {
          data: nodeData,
      },
      contentType: 'application/json'
    };
}