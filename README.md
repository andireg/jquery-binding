# jquery-binding
A simple data-binding API for jquery

## HTML

### Data binding
It's possible to bind some properties to values of the viewmodel.More than one binding can be defined at once.
#### Properties
* property: The property of the element. It can be:
** value: The value of the element. Used for input, textarea and select.
** checked: The state of a checkbox or radiobutton
** text: The inner text of the element.
** visibility: The visibility of the element.
** enabled: The state (disabled/enabled) of the element.
** style.{css-style-name}: The value of the css-property.
** attribute.{html-attribute-name}: The value of the attribute.
* path: Name of the property of the viewmodel.
* mode:
** get:
** set:
** getset:
* converter:
#### Example
```html
<input data-binding="property:value;path:title" />
<span data-binding="property:text;path:boolTest;converter:boolToCheckConverter|property:style.color;path:boolTest;converter:boolToColorConverter"></span>
```

### List binding
It's possible to bind to an array or (if UI should be updated on changes) to a Binding.ObservableCollection.
The first child element will be used as template for child elements. 
{{...}} will be replaced by the value of the item.
#### Properties:
* property: must be "items" (without quotes).
* path: Name of the property of the viewmodel.
#### Example:
```html
<ul data-binding="property:items;path:list">
    <li>
        <span>{{txt}}</span>
        <span data-binding="property:text;path:val"></span>
        <input data-binding="property:value;path:val" />
        <button data-binding="property:command;path:^remove;parameter:{{id}}">remove</button>
    </li>
</ul>
```

### Command binding
It's possible to bind a button, link or anything else to a function of the viewmodel.
#### Properties
* property: must be "command" (without quotes).
* path: Name of the property of the viewmodel.
#### Example
```html
<button data-binding="property:command;path:add">Click</button>
```

## Javascript 

### 1. Creating a viewmodel
There are two ways to create a viewmodel.
```javascript
// Proper way
var viewmodel = new Binding.NotifyPropertyChanged({
    title: "Hello World",
    list: new Binding.ObservableCollection(
        [
            new Binding.NotifyPropertyChanged({ id: Math.random(), txt: "First", val: 1 }),
            new Binding.NotifyPropertyChanged({ id: Math.random(), txt: "Second", val: 2 }),
            new Binding.NotifyPropertyChanged({ id: Math.random(), txt: "Third", val: 3 })
        ]
    ),
    add: function() {
        this.list.add(new Binding.NotifyPropertyChanged({ id: Math.random(), txt: "New", val: 0 }));
    }
});

// Alternate way
var viewmodel = Binding.bindableObject({
    title: "Hello World",
    list: [
        { id: Math.random(), txt: "First", val: 1 }, 
        { id: Math.random(), txt: "Second", val: 2 }, 
        { id: Math.random(), txt: "Third", val: 3 }
    ]
}).addCommand("add", function() {
    this.list.add(Binding.bindableObject({ id: Math.random(), txt: "New", val: 0 }));
});
```

### 2. React on changes in viewmodel 
```javascript
viewmodel.PropertyChanged.on(function(args) {
    switch (args.property) {
        case "title":
            console.log(args.value);
            break;
    }
});
```

### 3. Init binding
```javascript
$("body").binding(viewmodel);
```