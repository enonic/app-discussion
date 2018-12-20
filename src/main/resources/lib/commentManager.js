var appersist = require('/lib/openxp/appersist');
var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');
var tools = require('/lib/tools');

exports.createComment = createComment;
exports.modifyComment = modifyComment;
exports.getNodeData = getNodeData;
exports.getComments = getComments;
exports.getComment = getComment;
exports.createTestComments = createTestComments;

/**
 * Creates a new comment, assumes the current content is set.
 * @param {string} comment The comment of the new post 
 * @param {string} contentId The node id the comment is attached to
 * @param {String} [parent] Optional The parent node used as to set give a new child
 * @param {RepoConnection} [connection] Used to spesify what repo to use
 * @returns {Object} Repo node created or Null if failure
 */
function createComment(comment, contentId, parent, connection) {
    connection = connection || appersist.repository.getConnection();

    //Check if content exists
    var node = contentLib.get({ key: contentId });
    if (!node) {
        log.info("Got an contentId that does not exist");
        return null;
    } else if (!comment || comment.length === 0) {
        log.info("Posted an empty comment");
        return null;
    }

    var commentModel = {
        content: contentId,
        type: "comment",
        creationTime: new Date().toISOString(),
        data: {
            comment: portal.sanitizeHtml(comment),
            userName: "test", //adsfGetuserName(),
        },
    };

    var node;

    if (parent != null) {
        var parentNode = connection.get(parent);
        if (typeof parentNode === 'undefined' || parentNode === null) {
            log.info("Cant find parent with id:" + parent);
            return null;
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
 * Used to set a new comment 
 * @param {String} id 
 * @param {Strin} comment 
 * @param {RepoConnection} [connection]
 */
function modifyComment(id, comment, connection) {
    connection = connection || appersist.repository.getConnection();

    var result = connection.modify({
        key: id,
        editor: edit
    });

    var newComment = comment;

    function edit(node) {

        node.comment = newComment;

        return node;
    }

    if (!result) {
        log.info("Could not change comment with id: " + id);
    }
    tools.out(result);
}

/**
 * Generates a hierarchy of comments. (Recursive)
 * @param {Array} collection A group of comments
 * @param {Object} node repo Node to set in the collection
 * @returns {Boolean} success or failure
 */
function setChildNode(collection, node) {
    for (var j = 0; j < collection.length; j++) {
        if (collection[j]._id === node.parentId) {
            //If no children create child array
            if (typeof collection[j].children === "undefined" || collection[j].children == null) {
                collection[j].children = [getNodeData(node)];
            } else {
                addSorted(collection[j].children, node);
            }
            return true;
        } else if (typeof collection[j].children !== "undefined") {
            tools.out(collection[j].children);
            var set = setChildNode(collection[j].children, node);
            //If we found in children return true.
            if (set) return set;
        }
    }
    return false;
}

/**
 * Adds new elements to given array, sorted by the elements creationDate
 * @param {Array} group 
 * @param {Object} element
 */
function addSorted(group, element) {
    //reverse order since last comment is at the end.
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
 * Gets the values we need for rendering from a node.
 * @param {Object} node XP repo node
 * @returns {object}
 */
function getNodeData(node) {
    return {
        _id: node._id,
        name: portal.sanitizeHtml(node.data.userName), //https://xkcd.com/327/
        text: portal.sanitizeHtml(node.data.comment),
        creationTime: node.creationTime,
        time: formatDate(node.creationTime),
    };
}

/**
 * //Gets the all comments from the given content.
 * @param {String} id repo node id
 * @param {RepoConnection} [repoConnection] sets the repo connection to use
 * @returns {Array} Array of objects in a hierarcy structure
 */
function getComments(contentId, connection) {
    connection = connection || appersist.repository.getConnection();

    //Could sort by creation time for faster lookup?
    //500+ should be handle by pagination.
    var result = connection.query({
        start: 0,
        count: 500,
        query: "type='comment' AND content='" + contentId + "'",
        branch: "master",
    });

    //Array of objects with nested object.
    var comments = [];

    for (var i = 0; i < result.hits.length; i++) {
        var node = connection.get(result.hits[i].id);
        if (typeof node.parentId !== "undefined" && node.parentId !== null) {
            var check = setChildNode(comments, node);
            if (check == false) {
                log.info("could not set node:" + node._id);
            }
        } else {
            addSorted(comments, node);
        }
    }
    
    return comments;
}

/**
 * Get a comment from the given repoConnection
 * @param {String} commentId 
 * @param {RepoConnection} [connection] 
 * @returns {Object} Repo comment node
 */
function getComment(commentId, connection) {
    connection = connection || appersist.repository.getConnection();
    return connection.get({ keys: commentId });
}

//Create test Comments is used for testing only.
function createTestComments(connection) {
    var node = createComment(connection, "Lorem ipsum");
    createComment(connection, "This is a lot of text right2");
    //createComment(connection, "This is a lot of text right3");
    //createComment(connection, "This is a lot of text right4");
    var node2 = createComment(connection, "This is a lot of text right1.1", node._id);
    /*createComment(connection, "This is a lot of text right1.2", node._id);
    createComment(connection, "This is a lot of text right1.3", node._id);
    createComment(connection, "This is a lot of text right1.4", node._id);
    createComment(connection, "This is a lot of text right1.5", node._id);
    var node3 = createComment(connection, "Lorem ipsum with text1.1.1", node2._id);
    createComment(connection, "Lorem ipsum with text1.1.2", node2._id);*/
}

function formatDate(isoString) {
    var time = new Date(isoString);
    var timeStr = ('0' + time.getHours()).slice(-2) + ":" +
        ('0' + time.getMinutes()).slice(-2) + " " +
        ('0' + time.getDate()).slice(-2) + "/" +
        ('0' + (time.getMonth() + 1)).slice(-2) + "/" +
        time.getFullYear();
    return timeStr;
}