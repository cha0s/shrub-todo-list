
// Entry point for package management. Every package defining hooks does so
// through the registrar passed to `exports.pkgmanRegister`.
exports.pkgmanRegister = function(registrar) {

  // Implements hook `shrubOrmCollections`.
  registrar.registerHook('shrubOrmCollections', function() {

    // Return an object whose keys determine the name of the collection in the
    // system, and whose values are Waterline configuration.
    return {

      // We're only defining a TODO list item model since we only have one
      // global list in this example. It'd be possible to create a `todo-list`
      // model and associate the `todo-list-item`s with it, but we opt for
      // simplicity.
      'todo-list-item': {

        attributes: {

          // Whether the item is marked as completed.
          isCompleted: {
            type: 'boolean',
            defaultsTo: false
          },

          // The item text, e.g. "Make a TODO example for Shrub".
          text: {
            type: 'string'
          }
        }
      }
    };
  });

  // Implements hook `shrubRpcRoutes`.
  registrar.registerHook('shrubRpcRoutes', function() {

    var routes = [];

    // Get our collection.
    var TodoListItem = require('shrub-orm').collection('todo-list-item');

    // This route will be hit when a client first connects, to give them a
    // snapshot of the current TODO list.
    routes.push({
      path: 'todo-list',

      // Route middleware can be a single function. It will be normalized into
      // array form internally by the time shrubRpcRoutesAlter is invoked.
      middleware: function(req, res, next) {

        // Get the TODO list items, sorted by when they were created.
        TodoListItem.find().sort('createdAt DESC').then(function(items) {

          // Send the client the items.
          res.end(items);
        });
      }
    });

    // This route will be hit when a client wants to create a new item.
    routes.push({
      path: 'todo-list-item/create',

      // Route middleware can also be defined as an array. In this route, we
      // will handle validation before the main creation function is invoked.
      middleware: [

        // Validator. If next(error) is called here, the main creation function
        // will never be invoked.
        function(req, res, next) {

          // Text must not be empty.
          if (!req.body.text) {

            // Passing an error to next will return it to the client.
            return next(new Error("Item text must not be empty!"));
          }

          // Continue on normally to the next middleware function.
          next();
        },

        // Create an item.
        function(req, res, next) {

          var item = {text: req.body.text};

          TodoListItem.create(item).then(function(item) {

            // Work around waterline weirdness. You must remove the toJSON
            // method from all models returned from Waterline before sending
            // over a socket to prevent a stack overflow, because
            // model.toJSON() returns an object that also has a toJSON method,
            // and msgpack (used by socket.io) will recur until stack space
            // is exhausted.
            item.toJSON = undefined;

            // Send the client the new item.
            res.end(item);

            // Notify other clients of the creation.
            req.socket.broadcast.to('$global').emit(
              'todo-list-item/create', item
            );
          }).catch(next);
        }
      ]
    });

    // This route will be hit when a client wants to update an item.
    routes.push({
      path: 'todo-list-item/update',
      middleware: [

        // Validator.
        function(req, res, next) {

          // ID must be set.
          if (!req.body.id) {
            return next(new Error("ID must be supplied when updating a TODO item!"));
          }

          // Either text or isCompleted must be set.
          if (!req.body.text && !req.body.isCompleted) {
            return next(new Error("Item text or isCompleted must be set when updating a TODO item!"));
          }

          next();
        },

        // Update an item.
        function(req, res, next) {

          // Update the item with the values in the request body.
          TodoListItem.update({id: req.body.id}, req.body).then(function(items) {
            items[0].toJSON = undefined;

            // Send the client the updated item.
            res.end(items[0]);

            // Notify other clients of the update.
            req.socket.broadcast.to('$global').emit(
              'todo-list-item/update', items[0]
            );
          }).catch(next);
        }
      ]
    });

    // This route will be hit when a client wants to delete an item.
    routes.push({
      path: 'todo-list-item/delete',
      middleware: [

        // Validator.
        function(req, res, next) {

          // ID must be set.
          if (!req.body.id) {
            return next(new Error("ID must be supplied when deleting a TODO item!"));
          }

          next();
        },

        // Delete an item.
        function(req, res, next) {

          // Destroy by ID.
          TodoListItem.destroy({id: req.body.id}, req.body).then(function() {

            // Finish the request.
            res.end();

            // Notify other clients of the deletion.
            req.socket.broadcast.to('$global').emit(
              'todo-list-item/delete', {id: req.body.id}
            );
          }).catch(next);
        }
      ]
    });

    return routes;
  });
};
