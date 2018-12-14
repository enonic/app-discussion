var portal = require("/lib/xp/portal");
var contentLib = require("/lib/xp/content");
var thymeleaf = require("/lib/xp/thymeleaf");
var appersist = require('/lib/openxp/appersist');

function out(anything) {
    log.info(JSON.stringify(anything, null, 2));
}

/**
 * Creates a new comment
 * @param {RepoConnection} connection Used to create a node in XP repo
 * @param {string} comment The comment of the new post 
 * @param {String} [parent] Optional The parent node used as to set give a new child
 */
function createComment(connection, comment, parent) {
    var content = portal.getContent(); //Get the context its atteched to.

    var commentModel = {
        content: content._id,
        type: "comment",
        creationTime: new Date().toISOString(),
        data: {
            comment: comment,
            userName: "test", //adsfGetuserName(),
        },
    };

    var node;

    if (parent != null) {
        var parentNode = connection.get(parent);
        if (typeof parentNode === 'undefined' || parentNode === null) {
            throw "Cant find parent with id:" + parent;
        }
        //Setting parentPath set nested
        commentModel._parentPath = parentNode._path;
        commentModel.parentId = parentNode._id;
        node = connection.create(commentModel);

    } else {
        node = connection.create(commentModel);
    }
    return node;
}

/**
 * //Using the connection set a new comment on the node with given id.
 * @param {RepoConnection} connection 
 * @param {String} id 
 * @param {Strin} comment 
 */
function modifyComment(connection, id, comment) {
    var result = connection.modify({
        key: id,
        editor: edit
    });

    var newComment = comment;

    function edit(node) {

        node.comment = newComment;

        return node;
    }

    out(result);
}

//Recursive function
function setChildNode(collection, node) {
    for (var j = 0; j < collection.length; j++) {
        if (collection[j]._id === node.parentId) {
            //If no children create child listen
            if (typeof collection[j].children === "undefined" || collection[j].children === null) {
                collection[j].children = [getNodeData(node)];
            } else {
                addSorted(collection[j].children, node);
            }
            return true;
        } else if (typeof collection[j].children !== "undefined" || collection[j].children == null) {
            var set = setChildNode(collection[j].children, node);
            //If we found in children return true.
            if (set) return set;
        }
    }
    return false;
}

/**
 * Adds new elements to an array, sorted by node.creationDate
 * @param {Array} group 
 * @param {Object} element 
 */
function addSorted(group, element) {
    //reverse order since last comment usually is at the end.
    for (var index = group.length - 1; index >= -1; index--) {
        //No post in group is posted earlier put it in front
        if (index == -1) {
            group.splice(index, 0, getNodeData(element));
            break;
        }
        else if (group[index].creationTime < element.creationTime) {
            group.splice(index + 1, 0, getNodeData(element));
            break;
        }
    }
}

/**
 * Gets the values we need for rendering.
 * @param {Object} node Xp repo node
 */
//node model. Just a fast way to get node data
function getNodeData(node) {
    return {
        _id: node._id,
        name: portal.sanitizeHtml(node.data.userName), //https://xkcd.com/327/
        text: portal.sanitizeHtml(node.data.comment),
        creationTime: node.creationTime,
        time: formatDate(node.creationTime),
    };
}

function formatDate(isoString) {
    var time = new Date(isoString);
    var timeStr = time.getHours() + ":" + time.getMinutes() + " " +
        time.getDate() + "/" + (time.getMonth() + 1) + "/" + time.getFullYear();
    return timeStr;
}

function createTestComments(connection) {
    var node = createComment(connection, "Lorem ipsum");
    /*createComment(connection, "This is a lot of text right2");
    createComment(connection, "This is a lot of text right3");
    createComment(connection, "This is a lot of text right4");
    var node2 = createComment(connection, "This is a lot of text right1.1", node._id);
    createComment(connection, "This is a lot of text right1.2", node._id);
    createComment(connection, "This is a lot of text right1.3", node._id);
    createComment(connection, "This is a lot of text right1.4", node._id);
    createComment(connection, "This is a lot of text right1.5", node._id);
    var node3 = createComment(connection, "Lorem ipsum with text1.1.1", node2._id);
    createComment(connection, "Lorem ipsum with text1.1.2", node2._id);*/
}

exports.get = function () {
    //connect to repo: app.name and its master branch.
    var repoConnection = appersist.repository.getConnection();
    var content = portal.getContent();

    //Would win a lot of time if comments where sorted in a tree structure
    var result = repoConnection.query({
        start: 0,
        count: 500,
        //sort by creation time
        query: "type='comment' AND content='" + content._id + "'",
        branch: "master",
    });

    var discussion = [];

    for (var i = 0; i < result.hits.length; i++) {
        var node = repoConnection.get(result.hits[i].id);
        if (typeof node.parentId !== "undefined" && node.parentId !== null) {
            var check = setChildNode(discussion, node);
            if (check == false) {
                log.info("could not set node:" + node._id);
            }
        } else {
            addSorted(discussion, node);
        }
    }

    var model = {
        discussion: discussion
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
                "<script src='"+portal.assetUrl({ path: "script/comment-post.js" })+"'></script>",
            ]
        }
    };
};