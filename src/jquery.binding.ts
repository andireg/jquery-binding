/// <reference path="../typings/index.d.ts" />

namespace Binding {

    var converters : { [id: string]: IValueConverter; } = {};

    export class Constants {
        public static readonly COLLECTION_ACTION_ADD = "add";
        public static readonly COLLECTION_ACTION_INSERT = "insert";
        public static readonly COLLECTION_ACTION_CLEAR = "clear";
        public static readonly COLLECTION_ACTION_REMOVE = "remove";

        public static readonly PROPERTY_TYPE_COMMAND = "command";
        public static readonly PROPERTY_TYPE_ITEMS = "items";
        public static readonly PROPERTY_TYPE_CONTEXT = "context";
    }

    export interface IEvent<T> {
        on(handler: { (data?: T): void }) : void;
        off(handler: { (data?: T): void }) : void;
    }

    export interface IBindingOptions {
        property: string;
        path?: string;
        mode?: string;
        trigger?: string;
        parameter?: string;
        converter?: string;
    }

    export interface IPropertyChangedArgs {
        property: string;
        value: any;
    }

    export interface ICollectionChangedArgs {
        action: string;
        index?: number;
        item?: any;
    }

    export class TypedObservableCollection<T> {
        private data: T[];
        private readonly onCollectionChanged: Event<ICollectionChangedArgs> = new Event<ICollectionChangedArgs>();

        constructor(data: T[] = []) {
            this.data = data;
        }

        public add(item: T): TypedObservableCollection<T> {
            var index: number = this.data.length;
            this.data[index] = item;
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_ADD,
                index: index,
                item: item
            });
            return this;
        }

        public insert(index: number, item: T): TypedObservableCollection<T> {
            this.data.splice(index, 0, item);
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_INSERT,
                index: index,
                item: item
            });
            return this;
        }

        public remove(index: number): TypedObservableCollection<T> {
            this.data.splice(index, 1);
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_REMOVE,
                index: index
            });
            return this;
        }

        public clear(): TypedObservableCollection<T> {
            this.data.length = 0;
            this.onCollectionChanged.trigger({
                action: Constants.COLLECTION_ACTION_CLEAR
            });
            return this;
        }

        public all(): T[] {
            return this.data;
        }

        public itemAt(index: number): T {
            return this.data[index];
        }

        public get CollectionChanged(): IEvent<ICollectionChangedArgs> { 
            return this.onCollectionChanged.expose(); 
        }

        public get length(): number {
            return this.data.length;
        } 
    }

    export class ObservableCollection extends TypedObservableCollection<any> {
    }

    export class NotifyPropertyChanged {
        private readonly data: any = {};
        private readonly onPropertyChanged: Event<IPropertyChangedArgs> = new Event<IPropertyChangedArgs>();

        constructor(data: any = {}) {
            $.each(data, (key: string, value: any): void => {
                if(value instanceof Function) {
                    this.addCommand(key, value);
                } else {
                    this.addProperty(key, value);
                }
            });
        }

        public addProperty(name: string, value: any) : NotifyPropertyChanged {
            this.data[name] = value;
            Object.defineProperty(this, name, {
                get: ():any => {
                    return this.data[name];},
                set: (val: any): void => {
                    if(this.data[name] === val){
                        return;
                    }
                    this.data[name] = val;
                    this.onPropertyChanged.trigger({property: name, value: val});
                }
            });
            return this;
        }

        public addCommand(name: string, value: Function): NotifyPropertyChanged {
            this[name] = value;
            return this;
        }

        public get PropertyChanged(): IEvent<IPropertyChangedArgs> { 
            return this.onPropertyChanged.expose(); 
        } 

        public plain(): any {
            return this.data;
        }
    }

    interface IValueConverter {
        converter: Function;
        backConverter?: Function;
    }

    class Event<T> implements IEvent<T> {
        private handlers: { (data?: T): void; }[] = [];

        public on(handler: { (data?: T): void }) : void {
            this.handlers.push(handler);
        }

        public off(handler: { (data?: T): void }) : void {
            this.handlers = this.handlers.filter(h => h !== handler);
        }

        public trigger(data?: T) {
            this.handlers.slice(0).forEach(h => h(data));
        }

        public expose() : IEvent<T> {
            return this;
        }
    }

    class AbstractBinding {
        private property: string;
        private jquery: JQuery;
        private pathParts: string[];
        private context: any;
        private converter: IValueConverter;

        constructor(context: any, path: string, jquery: JQuery, property: string, converter: string = null) {
            if(path.substr(0, 1) === "^") {
                var contextElement: JQuery = jquery.closest("*[data-binding-context=context]");
                while(path.substr(0, 1) === "^") {
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

            var ctx: any = this.context;
            for(var idx: number = 0; idx < this.pathParts.length - 2; idx++) {
                if(ctx === undefined) {
                    break;
                }
                var prop: string = this.pathParts[idx];
                if(ctx.PropertyChanged) {
                    ctx.PropertyChanged.on((args: IPropertyChangedArgs) => {
                        if(prop === args.property) {
                            this.parentChanged();
                        }
                    });
                }
                ctx = ctx[prop];
            }
        }

        protected parentChanged(): void {

        }

        protected get CtxValue(): any {
            var value = this.context;
            $.each(this.pathParts, (n:number, s:string):void => {
                if(value === undefined) {
                    console.error("Path " + this.pathParts.join(".") + " does not exist!"); 
                    return null;
                }
                value = value[s];
            });
            if(this.converter){
                value = this.converter.converter(value);
            }
            return value;
        }

        protected set CtxValue(value: any) {
            var model = this.context;
            for(var idx: number = 0; idx < this.pathParts.length - 2; idx++){
                model = model[this.pathParts[idx]];
            }
            if(this.converter && this.converter.backConverter){
                value = this.converter.backConverter(value);
            }
            model[this.CtxProperty] = value;
        }

        protected get CtxProperty(): string {
            return this.pathParts.length === 0 ? null : this.pathParts[this.pathParts.length - 1];
        }

        protected get CtxPath(): string {
            return this.pathParts.join(".");
        }

        protected get Ctx(): string {
            return this.context;
        }

        protected get UiProperty(): string {
            return this.property;
        }

        protected get Jquery(): JQuery {
            return this.jquery;
        }
    }

    class SimpleBinding extends AbstractBinding {
        constructor(context: any, path: string, jquery: JQuery, property: string, mode: string, trigger: string, converter: string = null) {
            super(context, path, jquery, property, converter);
            this.setToUi();

            if(mode !== "set") {
                if (context.PropertyChanged) {
                    context.PropertyChanged.on((args: IPropertyChangedArgs): void => {
                        if(this.CtxProperty === args.property){
                            this.setToUi();
                        }
                    });
                } else {
                    console.warn(mode + " is not possible on property " + property);
                }
            }

            if (mode !== "get") {
                this.Jquery.on(trigger || "change", (args: JQueryEventObject): void => {
                    this.getFromUi();
                });
            }
        }

        protected parentChanged(): void {
            this.setToUi();
        }

        private getFromUi(): void {
            switch (this.UiProperty) {
                case "val":
                case "value":
                    this.CtxValue = this.Jquery.val();
                    break;
                case "checked":
                    this.CtxValue = this.Jquery.is(":checked");
                    break;
                default:
                    break;
            }
        }

        private setToUi() : void {
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
                    if(this.UiProperty.substr(0, 6).toLowerCase() === "style.") {
                        var styleProperty: string = this.UiProperty.substr(6);
                        this.Jquery.css(styleProperty, this.CtxValue);
                        break;
                    }
                    break;
            }
        }
    }

    class CommandBinding extends AbstractBinding {
        private parameter: string;

        constructor(context: any, path: string, jquery: JQuery, property: string, trigger: string, parameter: string) {
            super(context, path, jquery, property);
            this.parameter = parameter;
            jquery.on(trigger || "click", (e: JQueryEventObject): void => {
                this.call();
            });
        }

        private call(): void {
            var ctxValue: Function = this.CtxValue;
            if(!ctxValue) {
                console.error("Path " + this.CtxPath + " does not exist!"); 
                return;
            }
            ctxValue.apply(this.Ctx, [this.parameter]);
        }
    }

    class ListBinding extends AbstractBinding {
        private template: string;

        constructor(context: any, path: string, jquery: JQuery, property: string, converter: string = null) {
            super(context, path, jquery, property, converter);
            this.Jquery.data("binding-ctx", context).attr("data-binding-context", "context");
            this.template = jquery.data("binding-template");
            if(!this.template) {
                var templateItem: JQuery = jquery.children().first();
                this.template = templateItem[0].outerHTML;
                templateItem.remove();
            }

            var value: any = this.CtxValue;
            $.each(value.all() || value, (n:number, item: any): void => {
                this.addElement(item, n);
            });

            if(value.CollectionChanged){
                value.CollectionChanged.on((args: ICollectionChangedArgs):void => {
                    switch(args.action) {
                        case Constants.COLLECTION_ACTION_ADD:
                            this.addElement(args.item, args.index);
                            break;
                        case Constants.COLLECTION_ACTION_INSERT:
                            var newItem: JQuery = this.addElement(args.item, args.index);
                            if(args.index === 0) {
                                this.Jquery.prepend(newItem);        
                            }
                            else{
                                this.Jquery.children(":nth-child(" + (args.index) + ")").after(newItem);
                            }
                            break;
                        case Constants.COLLECTION_ACTION_REMOVE:
                            this.Jquery.children(":nth-child(" + (args.index + 1) + ")").remove();
                            break;
                        case Constants.COLLECTION_ACTION_CLEAR:
                            jquery.empty();
                            break;
                    }
                });
            }
        }

        private addElement(model: any, index: number): JQuery {            
            var html: string = this.template.replace(/\{\{([^\}]*)\}\}/gi, (found: string, ...args: any[]): string => {
                var property: string = args[0];
                return model[property];
            });
            var element: JQuery = $(html);
            this.Jquery.append(element);
            initialize(element, model);
            return element;
        }
    }

    class ContextBinding {
        private jquery: JQuery;
        private context: any;

        constructor(context: any, jquery: JQuery) {
            this.context = context;
            this.jquery = jquery;
            this.jquery.data("binding-ctx", context).attr("data-binding-context", "context");
            this.parseElements();
        }

        private parseElements(): void {
            this.jquery.find("*[data-binding]").each((n:number, e:Element):void => {
                var jq: JQuery = $(e);
                var optionString: string = jq.data("binding");
                var optionArray: string[] = optionString.split('|');
                $.each(optionArray, (i:number, s: string): void => {
                    var options: any = this.parseOptions(s);
                    initialize(jq, this.context, options);
                });
            });
        }

        private parseOptions(value: string): any {
            var regex: RegExp = /([^:]*):([^;]*)[;]{0,1}/gi;
            var founds: RegExpExecArray;
            var result: any = {};        
            do {
                founds = regex.exec(value);
                if (founds) {
                    result[founds[1]] = founds[2];
                }
            } while (founds);
            return result;
        }
    }

    function isObject(obj: any): boolean {
        return typeof obj === 'object';
    }

    export function registerConverter(key: string, converter: Function, backConverter: Function = null): void {
        converters[key] = {
            converter: converter,
            backConverter: backConverter
        };
    }

    export function simplifyObject(instance: any): any {
        var sourceObject: any;
        if(instance.PropertyChanged) {
            sourceObject = (<NotifyPropertyChanged>instance).plain();
        }
        if(isObject(instance)) {
            sourceObject = instance;
        }
        if(sourceObject) {
            var targetObject: any = {};
            $.each(sourceObject, (key: string, val: any): void => {
                targetObject[key] = simplifyObject(val);
            });
            return targetObject;
        }

        var sourceArray: any[];
        if(instance.CollectionChanged) {
            sourceArray = (<ObservableCollection>instance).all();
        }
        if(Array.isArray(instance)) {
            sourceArray = instance;
        }
        if(sourceArray) {
            var targetArray: any[] = [];
            $.each(sourceArray, (index: number, val: any): void => {
                targetArray[index] = simplifyObject(val);
            });
            return targetArray;
        }

        return instance;
    }

    export function bindableObject(instance: any): any {
        
        if(Array.isArray(instance)) {
            var array: any[] = [];
            $.each(instance, (index:number, value: any): void => {
                array[index] = bindableObject(value);
            });
            return new ObservableCollection(array);
        }

        if(isObject(instance)) {
            var obj: any = {};
            $.each(instance, (key: string, val: any): void => {
                obj[key] = bindableObject(val);
            });
            return new NotifyPropertyChanged(obj);
        }

        return instance;
    }

    export function initialize(jquery: JQuery, model: any, options: IBindingOptions = {property: Constants.PROPERTY_TYPE_CONTEXT}): void {
        switch(options.property) {
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
}

(function(w, $) {
  if (!$) return false;

  $.fn.extend({
    binding: function(model: any, options: Binding.IBindingOptions = {
        property: Binding.Constants.PROPERTY_TYPE_CONTEXT
    }): JQuery {
        Binding.initialize(this, model, options);
        return this;
    }
  });
})(window, jQuery);