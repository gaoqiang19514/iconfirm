var lg = console.log;

var buildOptions = function (options, option2) {
    if (typeof options === 'undefined') {
        options = {};
    }

    if (typeof options === 'string') {
        options = {
            title: options,
            content: option2 ? option2 : false
        };
    }

    return options;
};

var getObjectKeys = function(buttons){
    if(typeof buttons !== 'object'){
        return [];
    }
    
    var arr = [];
    $.each(buttons, function(){
        arr.push(this);
    });
    
    return arr;
};

var getObjectKeyOfIndex = function(obj, index){
    var count = 0;
    var key = null;
    $.each(obj, function(_index, item){
        if(count === index){
            key = _index;

            return false;
        }
        count++;
    });
    
    return key;
};

var getTypeButton = function(options, type){
    if(!options || !type){
        return {};
    }

    switch(type){
        case 'confirm':
            var buttons = {};
            var enableDefaultButtons = options['buttons'] !== false;

            if (typeof options['buttons'] !== 'object') {
                buttons = {};
            }
          
            var len = getObjectKeys(buttons).length;
            if(len === 0 && enableDefaultButtons){
                buttons = $.extend(true, {}, proxy.defaults.defaultButtons);
            }

            return buttons;
        case 'alert':
            var buttons = {};
            var enableDefaultButtons = options['buttons'] !== false;

            if (typeof options['buttons'] !== 'object') {
                buttons = {};
            }

            buttons = options['buttons'] ? options['buttons'] : {};
            
            var len = getObjectKeys(options['buttons']).length;
        
            if(len === 0 && enableDefaultButtons){
                var newButtons = $.extend(true, {}, proxy.defaults.defaultButtons);
                var first = getObjectKeyOfIndex(newButtons, 0);
                buttons[first] = newButtons[first];
            }

            return buttons;
        case 'dialog':
            return {};
    }

    return {};
};

$.iconfirm = function(options, options2){
    options = buildOptions(options, options2);

    options['buttons'] = getTypeButton(options, 'confirm');

    proxy(options);    
};

$.ialert = function(options, options2){
    options = buildOptions(options, options2);

    options['buttons'] = getTypeButton(options, 'alert');

    proxy(options);    
};

$.idialog = function(options, options2){
    options = buildOptions(options, options2);
    
    options['buttons'] = getTypeButton(options, 'idialog');

    proxy(options);    
};

var proxy = function(options){
    if (typeof options === 'undefined'){
        options = {};
    }

    var pluginOptions = $.extend(true, {}, proxy.defaults, options);
    
    new Iconfirm(pluginOptions);
};

proxy.defaults = {
    title: '',
    content: '',
    container: 'body',
    animationSpeed: 400,
    slogan: false,
    buttons: {

    },
    defaultButtons: {
        ok: {
            text: '确定',
            action: function(){}
        },
        cancel: {
            text: '取消',
            action: function(){}
        }
    },
    onOpen: function(){

    }
};


function Iconfirm(options){
    var template = '<div class="iconfirm">' +
                    '<div class="iconfirm__bg modal__bg--hidden"></div>' +
                    '<div class="iconfirm__container">' +
                        '<div class="iconfirm__cell">' +
                            '<div class="iconfirm__wrap iconfirm__wrap--sacle">' +
                                '<div class="iconfirm__head">' +
                                    '<div class="iconfirm__close-icon">×</div>' +
                                    '<div class="iconfirm__slogan"></div>' +
                                    '<div class="iconfirm__title"></div>' +
                                '</div>' +
                                '<div class="iconfirm__main">' +
                                    '<div class="iconfirm__content"></div>' +
                                '</div>' +
                                '<div class="iconfirm__foot">' +
                                    '<div class="iconfirm__buttons">' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

    this.options = options;                                         
    this.$template = $(template);

    $.extend(this, options);

    this.init();
}

Iconfirm.prototype.init = function(){
    this.buildUI();
    this.bindEvent();
    this.open();
};

Iconfirm.prototype.buildUI = function(){
    var self = this;
    var $template = this.$template;

    this.$bg      = $template.find('.iconfirm__bg');
    this.$slogan  = $template.find('.iconfirm__slogan');
    this.$title   = $template.find('.iconfirm__title');
    this.$cell    = $template.find('.iconfirm__cell');
    this.$content = $template.find('.iconfirm__content');
    this.$wrap    = $template.find('.iconfirm__wrap');
    this.$slogan  = $template.find('.iconfirm__slogan');
    this.$buttons = $template.find('.iconfirm__buttons');
    this.$closeIcon = $template.find('.iconfirm__close-icon');
    this.$confirm = $template.appendTo(this.options.container);

    this.contentReady = $.Deferred();

    if(this.options.titleClass){
        this.$title.addClass(this.options.titleClass)
    }

    this.setStartingPosition();

    if(this.width){
        this.$wrap.css('width', this.width);
    }

    this.setTitle();
    this.setSlogan();
    this.setContent();
    this.setButtonts();
    this.setDraggable();

    if(this.options.isAjax){
        this.showLoading();
    }

    $.when(this.contentReady).then(function(){
        if(self.isAjaxLoading){
            // 异步处理内容
        }else{
            // 同步处理内容
        }
    });

    // 执行动画效果
    this.$bg.css(this.setAnimationCSS(this.options.animationSpeed, 1));
    this.$wrap.css(this.setAnimationCSS(this.options.animationSpeed, 1));
};

Iconfirm.prototype.bindEvent = function(){
};

Iconfirm.prototype.setTitle = function(){
    this.$title.html(this.options.title);
};

Iconfirm.prototype.setSlogan = function(){
    if(!this.options.slogan){return;}
    this.$slogan.html(this.options.slogan);
};

Iconfirm.prototype.setContent = function(){
    this.$content.html(this.options.content);
};

Iconfirm.prototype.setButtonts = function(){
    var self = this;

    var buttons = this.buttons;

    var buttons_count = 0;
    if(typeof buttons !== 'object'){
        buttons = {};
    }

    $.each(buttons, function(key, button) {
        buttons_count++;


        // 包装用户传入的参数 如果不是预期的格式
        if(typeof button === 'function'){
            self.options.buttons[key] = button = {
                action: button
            };
        }

        buttons[key].text = button.text || key;
        buttons[key].btnClass = button.btnClass || 'btn-default';
        // 如果用户没有传入action 这赋值一个空的函数来替代
        buttons[key].action = button.action || function(){
        };

        buttons[key].keys = button.keys || [];
        buttons[key].isHidden = button.isHidden || false;
        buttons[key].isDisabled = button.isDisabled || false;

        $.each(buttons[key].keys, function(i, a){
            buttons[key].keys[i] = a.toLowerCase();
        });

        var button_element = $('<button type="button" class="iconfirm__btn"></button>')
            .html(buttons[key].text)
            .addClass(buttons[key].btnClass)
            .prop('disabled', buttons[key].isDisabled)
            .css('display', buttons[key].isHidden ? 'none' : '')
            .click(function(e){
                e.preventDefault();
                // 执行传入的action函数 
                var res = buttons[key].action.apply(self, [buttons[key]]);

                if(typeof res === 'undefined' || res){
                    self.close();
                }
            });

        self.$buttons.append(button_element);

    });

    if(buttons_count === 0) this.$buttons.hide();

    if(buttons_count > 1){
        self.$buttons.addClass('iconfirm__buttons--multipe');
    }

    self.$closeIcon.on('click', function(e){
        self.close();
    });
};

Iconfirm.prototype.open = function(){
    var that = this;
    this.$wrap.offset();

    this.$wrap.removeClass('iconfirm__wrap--sacle');
    this.$bg.removeClass('modal__bg--hidden');

    setTimeout(function(){
        if(typeof that.onOpen === 'function'){
            that.onOpen();
        }

    }, that.options.animationSpeed);
};

Iconfirm.prototype.close = function(){
    var that = this;

    this.$wrap.addClass('iconfirm__wrap--sacle');
    this.$bg.addClass('modal__bg--hidden');

    setTimeout(function(){

        that.$confirm.remove();

    }, that.options.animationSpeed);
};

Iconfirm.prototype.setDraggable = function(){
};

Iconfirm.prototype.setStartingPosition = function(){
};

Iconfirm.prototype.showLoading = function(){
};

Iconfirm.prototype.hideLoading = function(){
};

Iconfirm.prototype.setAnimationCSS = function(speed){
    var bounce = 1;
    var cubic_bezier = '0.36, 0.55, 0.19';

    return {
        '-webkit-transition-duration': speed / 1000 + 's',
        'transition-duration': speed / 1000 + 's',
        '-webkit-transition-timing-function': 'cubic-bezier(' + cubic_bezier + ', ' + bounce + ')',
        'transition-timing-function': 'cubic-bezier(' + cubic_bezier + ', ' + bounce + ')'
    };
};

Iconfirm.prototype.example = function(){

};

$.prototype.iconfirm = function(options, options2){
    if(typeof options === 'undefined'){
        options = {};
    }

    if(typeof options === 'string'){
        options = {
            content: options,
            title: options2 ? options2 : false
        };
    }

    $(this).each(function(){
        var $this = $(this);
        if($this.data('init')){ return; }

        $this.on('click', function(){
            $.iconfirm(options);
        });

        $this.data('init', true);
    });
};
