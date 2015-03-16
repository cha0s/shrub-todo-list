
exports.pkgmanRegister = function(registrar) {

  // Define a directive to display a TODO item. This is where most of the user
  // interaction occurs.
  registrar.registerHook('shrubAngularDirective', function() {

    return [

      // Inject the window object so we can focus the input when editing.
      '$window',

      // Inject our TODO list service.
      'todo-list',

      function ($window, todoList) {

        var directive = {};

        // Require an item to be passed in.
        directive.scope = {
          item: '='
        };

        // Define link function just how you would in Angular directly.
        directive.link = function(scope) {

          // Keep track of the original text value when editing, to check
          // whether we need to update the server or not.
          var originalText = '';

          // The form displayed when the user is viewing a TODO item.
          scope.viewingForm = {

            // Store the item in the form so fields can access it.
            item: scope.item,

            // The fields object defines all the form fields for this form.
            // By default, the fields' names are derived from the key, unless
            // explicitly overridden.
            fields: {

              // The TODO item text. This is a markup field, its value is
              // markup which goes through Angular's $compile and is linked
              // against the field scope.
              text: {
                type: 'markup',

                // Keep a style object in the field for applying dynamic CSS.
                style: {},

                // Bind the markup to the TODO item's text field, and apply
                // styles based on our style object (above).
                value: '                          \
                  <span                           \
                    data-ng-bind="form.item.text" \
                    data-ng-style="field.style"   \
                  ></span>                        \
                ',
              },

              // Below each TODO item text are actions to manipulate the item.
              // This is a group field, meaning all fields under this field
              // will be displayed inline.
              actions: {
                type: 'group',
                fields: {

                  // Submit button to edit the TODO item.
                  edit: {
                    type: 'submit',
                    value: 'Edit'
                  },

                  // Submit button to delete the TODO item.
                  'delete': {
                    type: 'submit',
                    value: 'Delete'
                  },

                  // A checkbox displaying and controlling whether the TODO
                  // item has been completed.
                  isCompleted: {
                    type: 'checkbox',
                    label: 'Completed',

                    // Link its value directly to the TODO item's isCompleted
                    // property.
                    model: 'form.item.isCompleted',

                    // This function is invoked when the field's value changes.
                    // By the time change() is called, the scope digest is
                    // completed, so the value will be propagated to the model.
                    change: function(isCompleted) {
                      todoList.update(scope.item);
                    }
                  }
                }
              }
            },

            // Form submission function. submits can be an array as well, with
            // each function being invoked upon form submission. Internally
            // it will always be normalized to an array before invoking
            // shrubFormAlter.
            submits: function(values, form) {

              // The special value form.$submitted will be populated with the
              // field that stimulated the submission. In other words, if you
              // click 'edit', form.$submitted will be the edit button's field
              // instance.
              switch (form.$submitted.name) {

                // User wants to edit the item. Change the editing state.
                case 'edit':
                  scope.isEditing = true;
                  break;

                // User wants to delete the TODO item. Just do it.
                case 'delete':
                  todoList.delete(scope.item);
                  break;
              }
            }
          };

          // The form displayed when the user is editing a TODO item.
          scope.editingForm = {
            item: scope.item,
            fields: {

              // A textfield where the user will type in the updated item text.
              text: {
                type: 'text',
                label: 'Update',

                // Link its value directly to the item text.
                model: 'form.item.text',

                // You can specify arbitrary HTML attributes. In this case, we
                // will set a unique ID for each item's text field, so we can
                // target it for focus when initiating the edit process for an
                // item.
                attributes: {
                  id: 'edit-text-' + scope.item.id
                }
              },

              // Submit button for updating the item once editing is complete.
              update: {
                type: 'submit',
                value: 'Update'
              },
            },

            // Here we use the array form for submits just to prove that it can
            // be done.
            submits: [

              // Values is an object which has field names as keys and field
              // values as values.
              function(values) {

                // Check the new item text against the original text. If it
                // changed, update the item.
                if (values.text !== originalText) {
                  todoList.update(scope.item);
                }

                // Change the editing state.
                scope.isEditing = false;
              }
            ]
          };

          // Watch the editing state for changes.
          scope.$watch('isEditing', function (isEditing) {

            // We only care if we're editing.
            if (!isEditing) return;

            // Remember the item's original text.
            originalText = scope.item.text;

            // The moment isEditing updates, the DOM won't be fully
            // transformed, meaning the edit form will not be visible yet.
            //
            // scope.$$postDigest is a little Angular hack that lets you
            // register a function to run after the scope digest cycle is
            // completed. This is exactly what we have to wait for to ensure
            // that the DOM is mutated and the edit form is visible.
            scope.$$postDigest(function() {

              // Look up our edit control and focus/select the text
              // automatically.
              $window.document.getElementById(
                'edit-text-' + scope.item.id
              ).select();
            });
          });

          // Watch the item's isCompleted property.
          scope.$watch('item.isCompleted', function (isCompleted) {

            // Make the text really big. We could of course use CSS to do this
            // and should, but this is just a demo and I'm lazy.
            var style = {'font-size': '30px'};

            // If the item was completed, strike a line through the text.
            if (isCompleted) {
              style['text-decoration'] = 'line-through';
            }

            // Set the style into the form field's style object.
            scope.viewingForm.fields.text.style = style;
          });
        };

        // We control which form is showing by using the ngIf directive. Forms
        // are displayed with the shrub-form directive, and the form definition
        // object is passed in through the form attribute on each directive.
        directive.template = '        \
          <div                        \
            data-ng-if="!isEditing"   \
          >                           \
            <div                      \
              data-shrub-form         \
              data-form="viewingForm" \
            ></div>                   \
          </div>                      \
          <div                        \
            data-ng-if="isEditing"    \
          >                           \
            <div                      \
              data-shrub-form         \
              data-form="editingForm" \
            ></div>                   \
          </div>                      \
        ';

        return directive;
      }
    ];
  });
};
