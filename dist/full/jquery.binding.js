/// <reference path="../typings/index.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Binding;
(function (Binding) {
    // ********** internal fields **********
    var converters = {};
    var Constants = (function () {
        function Constants() {
        }
        Constants.COLLECTION_ACTION_ADD = "add";
        Constants.COLLECTION_ACTION_INSERT = "insert";
        Constants.COLLECTION_ACTION_CLEAR = "clear";
        Constants.COLLECTION_ACTION_REMOVE = "remove";
        Constants.PROPERTY_TYPE_COMMAND = "command";
        Constants.PROPERTY_TYPE_ITEMS = "items";
        Constants.PROPERTY_TYPE_CONTEXT = "context";
        Constants.BINDING_MODE_GET = "get";
        Constants.BINDING_MODE_SET = "set";
        Constants.BINDING_MODE_BIDIRECT = "getset";
        return Constants;
    }());
    Binding.Constants = Constants;
    var TypedObservableCollection = (function () {
        function TypedObservableCollection(data) {
            if (data === void 0) { data = []; }
            this.onCollectionChanged = new Event();
            this.data = data;
        }
        TypedObservableCollection.prototype.add = function (item) {
            var index = this.data.length;
            this.data[index] = item;
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_ADD,
                index: index,
                item: item
            });
            return this;
        };
        TypedObservableCollection.prototype.insert = function (index, item) {
            this.data.splice(index, 0, item);
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_INSERT,
                index: index,
                item: item
            });
            return this;
        };
        TypedObservableCollection.prototype.remove = function (index) {
            this.data.splice(index, 1);
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_REMOVE,
                index: index
            });
            return this;
        };
        TypedObservableCollection.prototype.clear = function () {
            this.data.length = 0;
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_CLEAR
            });
            return this;
        };
        TypedObservableCollection.prototype.all = function () {
            return this.data;
        };
        TypedObservableCollection.prototype.itemAt = function (index) {
            return this.data[index];
        };
        Object.defineProperty(TypedObservableCollection.prototype, "CollectionChanged", {
            get: function () {
                return this.onCollectionChanged.expose();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TypedObservableCollection.prototype, "length", {
            get: function () {
                return this.data.length;
            },
            enumerable: true,
            configurable: true
        });
        return TypedObservableCollection;
    }());
    Binding.TypedObservableCollection = TypedObservableCollection;
    var ObservableCollection = (function (_super) {
        __extends(ObservableCollection, _super);
        function ObservableCollection() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ObservableCollection;
    }(TypedObservableCollection));
    Binding.ObservableCollection = ObservableCollection;
    var NotifyPropertyChanged = (function () {
        function NotifyPropertyChanged(data) {
            if (data === void 0) { data = {}; }
            var _this = this;
            this.data = {};
            this.onPropertyChanged = new Event();
            $.each(data, function (key, value) {
                if (value instanceof Function) {
                    _this.addCommand(key, value);
                }
                else {
                    _this.addProperty(key, value);
                }
            });
        }
        NotifyPropertyChanged.prototype.addProperty = function (name, value) {
            var _this = this;
            this.data[name] = value;
            Object.defineProperty(this, name, {
                get: function () {
                    return _this.data[name];
                },
                set: function (val) {
                    if (_this.data[name] === val) {
                        return;
                    }
                    _this.data[name] = val;
                    _this.onPropertyChanged.trigger({ property: name, value: val });
                }
            });
            return this;
        };
        NotifyPropertyChanged.prototype.addCommand = function (name, value) {
            this[name] = value;
            return this;
        };
        Object.defineProperty(NotifyPropertyChanged.prototype, "PropertyChanged", {
            get: function () {
                return this.onPropertyChanged.expose();
            },
            enumerable: true,
            configurable: true
        });
        NotifyPropertyChanged.prototype.plain = function () {
            return this.data;
        };
        return NotifyPropertyChanged;
    }());
    Binding.NotifyPropertyChanged = NotifyPropertyChanged;
    var Event = (function () {
        function Event() {
            this.handlers = [];
        }
        Event.prototype.on = function (handler) {
            this.handlers.push(handler);
        };
        Event.prototype.off = function (handler) {
            this.handlers = this.handlers.filter(function (h) { return h !== handler; });
        };
        Event.prototype.trigger = function (data) {
            this.handlers.slice(0).forEach(function (h) { return h(data); });
        };
        Event.prototype.expose = function () {
            return this;
        };
        return Event;
    }());
    var AbstractBinding = (function () {
        function AbstractBinding(context, path, jquery, property, converter) {
            if (converter === void 0) { converter = null; }
            var _this = this;
            if (path.substr(0, 1) === "^") {
                var contextElement = jquery.closest("*[data-binding-context=context]");
                while (path.substr(0, 1) === "^") {
                    path = path.substr(1);
                    contextElement = contextElement.parent().closest("*[data-binding-context=context]");
                }
                context = contextElement.data("binding-ctx");
            }
            this.context = context;
            this.pathParts = path ? path.split(".") : [];
            this.jquery = jquery;
            this.property = property;
            this.converter = converter ? converters[converter] : null;
            var ctx = this.context;
            for (var idx = 0; idx < this.pathParts.length - 2; idx++) {
                if (ctx === undefined) {
                    break;
                }
                var prop = this.pathParts[idx];
                if (ctx.PropertyChanged) {
                    ctx.PropertyChanged.on(function (args) {
                        if (prop === args.property) {
                            _this.parentChanged();
                        }
                    });
                }
                ctx = ctx[prop];
            }
        }
        AbstractBinding.prototype.parentChanged = function () {
        };
        Object.defineProperty(AbstractBinding.prototype, "CtxValue", {
            get: function () {
                var _this = this;
                var value = this.context;
                $.each(this.pathParts, function (n, s) {
                    if (value === undefined) {
                        console.error("Path " + _this.pathParts.join(".") + " does not exist!");
                        return null;
                    }
                    value = value[s];
                });
                if (this.converter) {
                    value = this.converter.converter(value);
                }
                return value;
            },
            set: function (value) {
                var model = this.context;
                for (var idx = 0; idx < this.pathParts.length - 2; idx++) {
                    model = model[this.pathParts[idx]];
                }
                if (this.converter && this.converter.backConverter) {
                    value = this.converter.backConverter(value);
                }
                model[this.CtxProperty] = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractBinding.prototype, "CtxProperty", {
            get: function () {
                return this.pathParts.length === 0 ? null : this.pathParts[this.pathParts.length - 1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractBinding.prototype, "CtxPath", {
            get: function () {
                return this.pathParts.join(".");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractBinding.prototype, "Ctx", {
            get: function () {
                return this.context;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractBinding.prototype, "UiProperty", {
            get: function () {
                return this.property;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractBinding.prototype, "Jquery", {
            get: function () {
                return this.jquery;
            },
            enumerable: true,
            configurable: true
        });
        return AbstractBinding;
    }());
    var SimpleBinding = (function (_super) {
        __extends(SimpleBinding, _super);
        function SimpleBinding(context, path, jquery, property, mode, trigger, converter) {
            if (converter === void 0) { converter = null; }
            var _this = _super.call(this, context, path, jquery, property, converter) || this;
            _this.setToUi();
            if (mode !== Constants.BINDING_MODE_SET) {
                if (context.PropertyChanged) {
                    context.PropertyChanged.on(function (args) {
                        if (_this.CtxProperty === args.property) {
                            _this.setToUi();
                        }
                    });
                }
                else {
                    console.warn("Context object of property [%s] is not a NotifyPropertyChanged!", property);
                }
            }
            if (mode !== Constants.BINDING_MODE_GET) {
                _this.Jquery.on(trigger || "change", function (args) {
                    _this.getFromUi();
                });
            }
            return _this;
        }
        SimpleBinding.prototype.parentChanged = function () {
            this.setToUi();
        };
        SimpleBinding.prototype.getFromUi = function () {
            switch (this.UiProperty) {
                case "val":
                case "value":
                    this.CtxValue = this.Jquery.val();
                    break;
                case "checked":
                    this.CtxValue = this.Jquery.is(":checked");
                    break;
                case "text":
                    this.CtxValue = this.Jquery.text();
                    break;
                case "visibility":
                    this.CtxValue = this.Jquery.css("display");
                    break;
                case "enabled":
                    this.CtxValue = this.Jquery.is(":disabled");
                    break;
                default:
                    if (this.UiProperty.substr(0, 6).toLowerCase() === "style.") {
                        var styleProperty = this.UiProperty.substr(6);
                        this.CtxValue = this.Jquery.css(styleProperty);
                        break;
                    }
                    if (this.UiProperty.substr(0, 10).toLowerCase() === "attribute.") {
                        var attribute = this.UiProperty.substr(10);
                        this.CtxValue = this.Jquery.attr(attribute);
                        break;
                    }
                    console.warn("Cannot get value from property %s!", this.UiProperty);
                    break;
            }
        };
        SimpleBinding.prototype.setToUi = function () {
            switch (this.UiProperty) {
                case "val":
                case "value":
                    this.Jquery.val(this.CtxValue);
                    break;
                case "checked":
                    this.Jquery.prop("checked", this.CtxValue ? "checked" : null);
                    break;
                case "text":
                    this.Jquery.text(this.CtxValue);
                    break;
                case "visibility":
                    this.Jquery.css("display", this.CtxValue ? "" : "none");
                    break;
                case "enabled":
                    this.Jquery.attr("disabled", this.CtxValue ? null : "disabled");
                    break;
                default:
                    if (this.UiProperty.substr(0, 6).toLowerCase() === "style.") {
                        var styleProperty = this.UiProperty.substr(6);
                        this.Jquery.css(styleProperty, this.CtxValue);
                        break;
                    }
                    if (this.UiProperty.substr(0, 10).toLowerCase() === "attribute.") {
                        var attribute = this.UiProperty.substr(10);
                        this.Jquery.attr(attribute, this.CtxValue);
                        break;
                    }
                    console.warn("Cannot set value to property %s!", this.UiProperty);
                    break;
            }
        };
        return SimpleBinding;
    }(AbstractBinding));
    var CommandBinding = (function (_super) {
        __extends(CommandBinding, _super);
        function CommandBinding(context, path, jquery, property, trigger, parameter) {
            var _this = _super.call(this, context, path, jquery, property) || this;
            _this.parameter = parameter;
            jquery.on(trigger || "click", function (e) {
                _this.call();
            });
            return _this;
        }
        CommandBinding.prototype.call = function () {
            var ctxValue = this.CtxValue;
            if (!ctxValue) {
                console.warn("Command [" + this.CtxPath + "] does not exist!");
                return;
            }
            console.log("Command [" + this.CtxPath + "] applied.");
            ctxValue.apply(this.Ctx, [this.parameter]);
        };
        return CommandBinding;
    }(AbstractBinding));
    var ListBinding = (function (_super) {
        __extends(ListBinding, _super);
        function ListBinding(context, path, jquery, property, converter) {
            if (converter === void 0) { converter = null; }
            var _this = _super.call(this, context, path, jquery, property, converter) || this;
            _this.Jquery.data("binding-ctx", context).attr("data-binding-context", "context");
            _this.template = jquery.data("binding-template");
            if (!_this.template) {
                var templateItem = jquery.children().first();
                _this.template = templateItem[0].outerHTML;
                templateItem.remove();
            }
            var value = _this.CtxValue;
            $.each(value.all() || value, function (n, item) {
                _this.addElement(item, n);
            });
            if (value.CollectionChanged) {
                value.CollectionChanged.on(function (args) {
                    console.log("List action [%s] index %d on [%s] executed (item %o).", args.action, args.index, _this.CtxPath, args.item);
                    switch (args.action) {
                        case Constants.COLLECTION_ACTION_ADD:
                            _this.addElement(args.item, args.index);
                            break;
                        case Constants.COLLECTION_ACTION_INSERT:
                            var newItem = _this.addElement(args.item, args.index);
                            if (args.index === 0) {
                                _this.Jquery.prepend(newItem);
                            }
                            else {
                                _this.Jquery.children(":nth-child(" + (args.index) + ")").after(newItem);
                            }
                            break;
                        case Constants.COLLECTION_ACTION_REMOVE:
                            _this.Jquery.children(":nth-child(" + (args.index + 1) + ")").remove();
                            break;
                        case Constants.COLLECTION_ACTION_CLEAR:
                            jquery.empty();
                            break;
                    }
                });
            }
            return _this;
        }
        ListBinding.prototype.addElement = function (model, index) {
            var html = this.template.replace(/\{\{([^\}]*)\}\}/gi, function (found) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var property = args[0];
                return model[property];
            });
            var element = $(html);
            this.Jquery.append(element);
            initialize(element, model);
            return element;
        };
        return ListBinding;
    }(AbstractBinding));
    var ContextBinding = (function () {
        function ContextBinding(context, jquery) {
            this.context = context;
            this.jquery = jquery;
            this.jquery.data("binding-ctx", context).attr("data-binding-context", "context");
            this.parseElements();
        }
        ContextBinding.prototype.parseElements = function () {
            var _this = this;
            this.jquery.find("*[data-binding]").each(function (n, e) {
                var jq = $(e);
                var optionString = jq.data("binding");
                var optionArray = optionString.split('|');
                $.each(optionArray, function (i, s) {
                    var options = _this.parseOptions(s);
                    initialize(jq, _this.context, options);
                });
            });
        };
        ContextBinding.prototype.parseOptions = function (value) {
            var regex = /([^:]*):([^;]*)[;]{0,1}/gi;
            var founds;
            var result = {};
            do {
                founds = regex.exec(value);
                if (founds) {
                    result[founds[1]] = founds[2];
                }
            } while (founds);
            return result;
        };
        return ContextBinding;
    }());
    function isObject(obj) {
        return typeof obj === 'object';
    }
    function registerConverter(key, converter, backConverter) {
        if (backConverter === void 0) { backConverter = null; }
        converters[key] = {
            converter: converter,
            backConverter: backConverter
        };
    }
    Binding.registerConverter = registerConverter;
    function simplifyObject(instance) {
        var sourceObject;
        if (instance.PropertyChanged) {
            sourceObject = instance.plain();
        }
        if (isObject(instance)) {
            sourceObject = instance;
        }
        if (sourceObject) {
            var targetObject = {};
            $.each(sourceObject, function (key, val) {
                targetObject[key] = simplifyObject(val);
            });
            return targetObject;
        }
        var sourceArray;
        if (instance.CollectionChanged) {
            sourceArray = instance.all();
        }
        if (Array.isArray(instance)) {
            sourceArray = instance;
        }
        if (sourceArray) {
            var targetArray = [];
            $.each(sourceArray, function (index, val) {
                targetArray[index] = simplifyObject(val);
            });
            return targetArray;
        }
        return instance;
    }
    Binding.simplifyObject = simplifyObject;
    function bindableObject(instance) {
        if (Array.isArray(instance)) {
            var array = [];
            $.each(instance, function (index, value) {
                array[index] = bindableObject(value);
            });
            return new ObservableCollection(array);
        }
        if (isObject(instance)) {
            var obj = {};
            $.each(instance, function (key, val) {
                obj[key] = bindableObject(val);
            });
            return new NotifyPropertyChanged(obj);
        }
        return instance;
    }
    Binding.bindableObject = bindableObject;
    function initialize(jquery, model, options) {
        if (options === void 0) { options = { property: Constants.PROPERTY_TYPE_CONTEXT }; }
        switch (options.property) {
            case Constants.PROPERTY_TYPE_CONTEXT:
                new ContextBinding(model, jquery);
                return;
            case Constants.PROPERTY_TYPE_COMMAND:
                new CommandBinding(model, options.path, jquery, options.property, options.trigger, options.parameter);
                return;
            case Constants.PROPERTY_TYPE_ITEMS:
                new ListBinding(model, options.path, jquery, options.property, options.converter);
                return;
            default:
                new SimpleBinding(model, options.path, jquery, options.property, options.mode, options.trigger, options.converter);
                return;
        }
    }
    Binding.initialize = initialize;
})(Binding || (Binding = {}));
(function (w, $) {
    if (!$)
        return false;
    $.fn.extend({
        binding: function (model, options) {
            if (options === void 0) { options = {
                property: Binding.Constants.PROPERTY_TYPE_CONTEXT
            }; }
            Binding.initialize(this, model, options);
            return this;
        }
    });
})(window, jQuery);
