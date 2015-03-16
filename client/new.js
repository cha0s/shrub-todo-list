
exports.pkgmanRegister = function(registrar) {

  registrar.registerHook('shrubAngularDirective', function() {

    return [

      'todo-list',

      function(todoList) {

        var directive = {};

        directive.scope = {};

        directive.link = function(scope) {

          // The form to add a new item.
          scope.form = {
            fields: {
              group: {
                type: 'group',
                fields: {

                  // The textfield for the new item's text.
                  text: {
                    type: 'text',
                    label: 'Create a new TODO item'
                  },

                  // Submit button to create the item.
                  submit: {
                    type: 'submit',
                    value: 'Create new item'
                  }
                }
              }
            },
            submits: function (values, form) {

              // Create the TODO item.
              todoList.create(values.text);

              // Blank out the text field.
              form.fields.group.fields.text.value = '';
            }
          };
        };

        directive.template = ' \
          <div                 \
            data-shrub-form    \
            data-form="form"   \
          ></div>              \
        '

        return directive;
      }

    ];
  });
};
