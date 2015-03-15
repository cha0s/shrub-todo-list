
exports.pkgmanRegister = function(registrar) {

  registrar.registerHook('shrubAngularDirective', function() {

    return [

      'todo-list', function(todoList) {

        var directive = {};

        directive.scope = {};

        // Make the TODO list accessible to our directive.
        directive.link = function(scope) {
          scope.todoList = todoList;
        };

        // Use the TODO list items to built an unordered list. Each list item
        // receives the corresponding TODO item.
        directive.template = '                                       \
          <ul                                                        \
            data-ng-repeat="item in todoList.items track by item.id" \
          >                                                          \
            <li                                                      \
              data-todo-list-item                                    \
              data-item="item"                                       \
            ></li>                                                   \
          </ul>                                                      \
        ';

        return directive;
      }

    ];
  });
};
