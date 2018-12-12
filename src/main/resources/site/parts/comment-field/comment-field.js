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
    var commentModel = {
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
        //Setting parentPath so (hopefully this set things nested)
        commentModel._parentPath = parentNode._path;
        commentModel.parentId = parentNode.id;
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
        //Check if we have a match
        if (collection[i]._id === node.parentId) {
            //If no children create child listen
            if (typeof collection[i].children === "undefined" || collection[i].children === null) {
                collection[i].children = [getNodeData(node)];
            } else {
                addChildSorted(collection[i].children, node);
            }
            return true;
        } else if (typeof collection[i].children !== "undefined" || collection[i].children == null) {
            var set = setChildNode(collection[i].children, node);
            //If we found in children return true.
            if (set) return set;
        }
    }
    return false;
}

//Childs are sorted by creating time
function addSorted(group, element) {
    //reverse order since last comment usually is at the end.
    for (var index = group.length; index >= 0; index--) {
        //First post if reached the start of the array
        if (index == 0) {
            group.splice(index, 0, getNodeData(element));
        }
        else if (group[index].creationTime < element.creationTime) {
            group.splice(index + 1, 0, getNodeData(element));
        }
    }
}

//node model. Just a fast way to get node data
function getNodeData(node) {
    return { name: node.data.userName, text: node.data.comment, creationTime: node.creationTime};
}

exports.get = function () {
    //connect to repo: app.name and its master branch.
    var repoConnection = appersist.repository.getConnection();

    //var you = createComment(repoConnection, "This is a lot of text right");
    //var child = createComment(repoConnection, "Lorem ipsum dollar si amet", you._id);
    //createComment(repoConnection, "Lorem ipsum dollar si amet", child._id); //grandchild

    //Would win a lot of time if comments where sorted in a tree structure
    var result = repoConnection.query({
        start: 0,
        count: 500,
        //sort by creation time
        query: "type='comment'",
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
            log.info("Set node");
            addSorted(getNodeData(node));
        }
    }

    out(discussion);

    var model = {
        discussion: [
            { 'name': 'Jakob', 'text': 'Lorem ipsum dollar' },
            { 'name': 'Mohammed', 'text': 'Lorem ipsum dollar' },
            { 'name': 'Azan', 'text': 'Lorem ipsum dollar' }
        ]
    };

    var view = resolve("comment-field.html");

    return {
        body: thymeleaf.render(view, model),
    };
};