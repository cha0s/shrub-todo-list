
exports.pkgmanRegister = function(registrar) {

  // Define a route in our Angular app for the TODO list.
  registrar.registerHook('shrubAngularRoutes', function() {
    var routes = [];

    // This is our main /todo path.
    routes.push({
      path: 'todo',
      title: 'TODO',

      // Show our top-level directives. Directive names default to reflect the
      // package structure, with the 'client' path removed and all non-word
      // characters converted to dashes. So the directive defined at
      // todo-list/client/list.js will default to todo-list-list, and the
      // directive defined at todo-list/client/new.js will default to
      // todo-list-new.
      //
      // We prepend the data- prefix to all custom attributes as a best
      // practice -- though it isn't strictly necessary, it ensures the HTML
      // is valid.
      template: '                       \
        <div data-todo-list-list></div> \
        <div data-todo-list-new></div>  \
      '
    });

    return routes;
  });

  // Define a service to manage our TODO list.
  registrar.registerHook('shrubAngularService', function() {

    // We return an annotated function, just like if we were using Angular
    // directly. In this case we are using array notation.
    return [

      // We communicate with the server over RPC.
      'shrub-rpc',

      function(rpc) {

        var service = {

          // The array of TODO items.
          items: []
        };

        // Create a TODO item.
        service.create = function(text) {

          // RPC calls return a promise.
          rpc.call('todo-list-item/create', {text: text}).then(function(item) {
            service.items.push(item);
          });
        };

        // Update a TODO item.
        service.update = function(item) {
          rpc.call('todo-list-item/update', item).then(function(updated) {
            item.text = updated.text;
            item.isCompleted = updated.isCompleted;
          });
        };

        // Delete a TODO item.
        service.delete = function(item) {
          rpc.call('todo-list-item/delete', {id: item.id}).then(function() {
            var index = service.items.indexOf(item);
            if (~index) service.items.splice(index, 1);
          });
        };

        // Server told us to create an item.
        rpc.on('todo-list-item/create', function(item) {
          service.items.push(item);
        });

        // Server told us to update an item.
        rpc.on('todo-list-item/update', function(item) {
          for (var i in service.items) {
            if (item.id === service.items[i].id) {
              service.items[i].text = item.text;
              service.items[i].isCompleted = item.isCompleted;
            }
          }
        });

        // Server told us to delete an item.
        rpc.on('todo-list-item/delete', function(item) {
          for (var i in service.items) {
            if (item.id === service.items[i].id) {
              return service.items.splice(i, 1);
            }
          }
        });

        // Immediately retrieve the TODO items and populate the list.
        rpc.call('todo-list').then(function(items) {
          items.forEach(function(item) {
            service.items.push(item);
          });
        });

        return service;
      }
    ];
  });

  // Hook into the main navigation and add our path. This is admittedly not
  // ideal, in lieu of a proper menu API.
  registrar.registerHook('shrubSkinLink--shrubSkinStrappedMainNav', function() {
    return [
      '$scope', function($scope) {
        $scope.menu.items.push({path: 'todo', label: 'TODO'})
      }
    ];
  });

  // Recur into subpackages.
  registrar.recur([
    'item', 'list', 'new'
  ]);
};
