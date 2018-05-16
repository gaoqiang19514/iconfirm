var lg = console.log;

var isString = function(obj){
    return Object.prototype.toString.call(obj) === '[object String]';
};

var isArray = function(obj){
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var isObject = function(obj){
    return Object.prototype.toString.call(obj) === '[object Object]';
};

var supportCss3 = function(style){
    var prefix = ['webkit', 'Moz', 'ms', 'o'],
        i,
        humpString = [],
        htmlStyle = document.documentElement.style,
        _toHumb = function (string) {
            return string.replace(/-(\w)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
        };

    for (i in prefix)
        humpString.push(_toHumb(prefix[i] + '-' + style));

    humpString.push(_toHumb(style));

    for (i in humpString)
        if (humpString[i] in htmlStyle) return true;

    return false;
}

// 参数包装 允许用户使用字符串参数调用和对象参数调用 但是字符串参数需要进行包装
// 并且这种参数包装逻辑不应该交给Icofirm 所以要抽取出来
var buildOptions = function (options, option2) {
    if (typeof options === 'undefined') {
        options = {};
    }

    if (isString(options)) {
        options = {
            title: options,
            content: option2 ? option2 : false
        };
    }

    return options;
};

var getObjectKeys = function (buttons) {
    if (typeof buttons === 'undefined') {
        return [];
    }

    var arr = [];
    $.each(buttons, function () {
        arr.push(this);
    });

    return arr;
};

var getObjectKeyOfIndex = function (obj, index) {
    var count = 0, res = null;

    $.each(obj, function (key) {
        if (count === index) {
            res = key;
            return false;
        }
        count++;
    });

    return res;
};

var getTypeButtons = function (options, type) {
    if (!options || !type) { return {}; }

    switch (type) {
        case 'confirm':
            var buttons = {};

            if(typeof options['buttons'] !== 'undefined'){
                buttons = options['buttons'];
            }

            if (getObjectKeys(buttons).length === 0 && (buttons !== false)) {
                buttons = $.extend({}, proxy.defaults.defaultButtons);
            }
  
            return buttons;
        case 'alert':
            var buttons = {};
            
            if(typeof options['buttons'] !== 'undefined'){
                buttons = options['buttons'];
            }

            if (getObjectKeys(buttons).length === 0 && (buttons !== false)) {
                var defaultButtons = $.extend({}, proxy.defaults.defaultButtons);
                var first = getObjectKeyOfIndex(defaultButtons, 0);
                buttons[first] = defaultButtons[first];
            }

            return buttons;
        case 'dialog':
            return {};
    }
};


// ----------------------------------------------------------------------------------------

$.iconfirm = function (options, options2) {
    var buttons = {};

    options = buildOptions(options, options2);
    buttons = getTypeButtons(options, 'confirm');

    options['buttons'] = buttons;

    proxy(options);
};

$.ialert = function (options, options2) {
    var buttons = {};

    options = buildOptions(options, options2);
    buttons = getTypeButtons(options, 'alert');

    options['buttons'] = buttons;

    proxy(options);
};

$.idialog = function (options, options2) {
    var buttons = {};

    options = buildOptions(options, options2);
    buttons = getTypeButtons(options, 'dialog');
    
    options['buttons'] = buttons;

    proxy(options);
};

// ----------------------------------------------------------------------------------------

var proxy = function (options) {
    if (typeof options === 'undefined') {
        options = {};
    }

    var pluginOptions = $.extend(true, {}, proxy.defaults, options);

    new Iconfirm(pluginOptions);
};

proxy.lastClicked = false;

$(document).on('mousedown.proxy', 'button, a', function () {
    proxy.lastClicked = $(this);
});

proxy.defaults = {
    putCloseIcon:       true,
    title:              '',
    content:            '',
    target:             'body',
    animationSpeed:     400,
    slogan:             false,
    backgroundDismiss:  true,
    dragWindowGap:      20,
    animateFromElement: true,
    buttons:            {},
    defaultButtons: {
        ok: {
            text: '确定',
            action: function () {}
        },
        cancel: {
            text: '取消',
            action: function () {}
        }
    },
    onOpen: function () {}
};


function Iconfirm(options) {
    var template =  '<div class="iconfirm">' +
                        '<div class="iconfirm__bg iconfirm__bg--hidden"></div>' +
                        '<div class="iconfirm__table">' +
                            '<div class="iconfirm__cell">' +
                                '<div class="iconfirm__animation">' +
                                    '<div class="iconfirm__move">' +
                                        '<div class="iconfirm__box iconfirm__box--sacle">' +
                                            '<div class="iconfirm__head">' +
                                                '<div class="iconfirm__close-icon">×</div>' +
                                                '<div class="iconfirm__slogan"></div>' +
                                                '<div class="iconfirm__title"></div>' +
                                            '</div>' +
                                            '<div class="iconfirm__main">' +
                                                '<div class="iconfirm__content">' +
                                                '</div>' +
                                                '<div class="iconfirm__loading"><img src="./images/loading.gif" /></div>' +
                                            '</div>' +
                                            '<div class="iconfirm__foot">' +
                                                '<div class="iconfirm__buttons"></div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

    this.options   = options;
    this.$template = $(template);

    this.bodyOverflowCache = '';
    this.isAjax = false;
    this.isAjaxLoading = false;

    $.extend(this, options);

    this.init();
}

Iconfirm.prototype.init = function () {
    this.buildUI();
    this.bindEvent();
    this.open();
};

Iconfirm.prototype.buildUI = function () {
    var self              = this;
    var $template         = this.$template;
    
    this.$win       = $(window);
    this.$body      = $('body');
    this.$confirm   = $template.appendTo(this.target);
    this.$bg        = $template.find('.iconfirm__bg');
    this.$table     = $template.find('.iconfirm__table');
    this.$cell      = $template.find('.iconfirm__cell');
    this.$animation = $template.find('.iconfirm__animation');
    this.$move      = $template.find('.iconfirm__move');
    this.$box       = $template.find('.iconfirm__box');
    this.$head      = $template.find('.iconfirm__head');
    this.$title     = $template.find('.iconfirm__title');
    this.$slogan    = $template.find('.iconfirm__slogan');
    this.$closeIcon = $template.find('.iconfirm__close-icon');
    this.$content   = $template.find('.iconfirm__content');
    this.$buttons   = $template.find('.iconfirm__buttons');
    this.$loading   = $template.find('.iconfirm__loading');

    this.contentReady = $.Deferred();

    // 设置动画起点
    this.setAnimationPosition();

    if (this.width) {
        this.$box.css('width', this.width);
    }

    if(!supportCss3('animation')){
        this.animationSpeed = 1;
    }

    this.setTitle();
    this.setSlogan();
    this.setButtonts();
    this.setDraggable();
    this.parseContent();
    this.hideBodyScrollBar();

    // 这里的副作用解决了slogan弹层动画起始位置错误的问题
    this.fixScrollbar();
    
    if (this.isAjax) {
        this.showLoading();
    }

    $.when(this.contentReady).then(function () {
        if (self.isAjaxLoading) {
            // 异步处理内容
            self.isAjaxLoading = false;
            self.hideLoading();
        } else {
            // 同步处理内容
            self.setContent();
        }
    });


    // 执行动画效果预设
    this.$bg.css(this.setAnimationCSS(this.animationSpeed, 1));
    this.$box.css(this.setAnimationCSS(this.animationSpeed, 1));
    this.$animation.css(this.setAnimationCSS(this.animationSpeed, 1));
};

Iconfirm.prototype.setTitle = function () {
    this.$title.html(this.title);
};

Iconfirm.prototype.parseContent = function () {
    var that = this;
    var e = '&nbsp;';

    if(typeof this.content === 'function'){
        var res = this.content.apply(this);

        if(typeof res === 'string'){
            this.content = res;
        }else if(typeof res === 'object' && typeof res.always === 'function'){
            // this is ajax loading via promise
            this.isAjax = true;
            this.isAjaxLoading = true;

            res.always(function(data, status, xhr){
                that.contentReady.resolve(data, status, xhr);
            });
            this.content = e;
        }else{
            this.content = e;
        }
    }

    if(!this.isAjax){
        that.contentReady.resolve();
    }
};


Iconfirm.prototype.setContent = function (_content) {
    if(_content){
        this.$content.html(_content);    
    }else{
        this.$content.html(this.content);
    }
};

Iconfirm.prototype.setSlogan = function () {
    if (!this.slogan) {
        this.$slogan.hide();
    }else{
        this.$slogan.html(this.slogan);
    }
};


Iconfirm.prototype.setButtonts = function () {
    var self          = this;
    var buttons_count = 0;
    var buttons       = this.buttons;

    if (typeof buttons === 'undefined') {
        buttons = {};
    }

    $.each(buttons, function (key, button) {
        buttons_count++;

        if (typeof button === 'function') {
            self.buttons[key] = button = {
                action: button
            };
        }

        button.text       = button.text || key;
        button.btnClass   = button.btnClass || 'btn-default';
        button.action     = button.action || function () {};
        button.keys       = button.keys || [];
        button.isHidden   = button.isHidden || false;
        button.isDisabled = button.isDisabled || false;

        $.each(button.keys, function (i, item) {
            button.keys[i] = item.toLowerCase();
        });

        var button_element = $('<button type="button" class="iconfirm__btn"></button>')
            .html(button.text)
            .addClass(button.btnClass)
            .prop('disabled', button.isDisabled)
            .css('display', button.isHidden ? 'none' : '')
            .click(function (e) {
                var res = button.action.apply(self, [button]);
                if (typeof res === 'undefined' || res) {
                    self.close();
                }

                return false;
            });

        self.$buttons.append(button_element);
    });

    if (buttons_count === 0){
        this.$buttons.hide()
    }else if(buttons_count > 1){
        self.$buttons.addClass('iconfirm__buttons--multipe');
    }
  
    if(self.putCloseIcon){
        self.$closeIcon.on('click', function (e) {
            self.close();
        });
    }else{
        self.$closeIcon.hide();
    }
};

Iconfirm.prototype.hideBodyScrollBar = function () {
    this.bodyOverflowCache = this.$body.css('overflow');
    this.$body.css('overflow', 'hidden');
};

Iconfirm.prototype.releaseHideBodyScrollBar = function () {
    if(this.bodyOverflowCache){
        this.$body.css('overflow', this.bodyOverflowCache);
    }else{
        this.$body.css('overflow', '');
    }
};

Iconfirm.prototype.measureScrollbarWidth = function(){
    var $div = $('<div style="width: 100px; height: 100px; outline: 1px solid red; overflow: scroll;"><div></div></div>');
    $('body').append($div);
    var divW = $div.width();
    var divInnerW = $div.find('div').width();

    $div.remove();
    return divW - divInnerW;
};

Iconfirm.prototype.scrollTop = function(){
    if (typeof pageYOffset !== 'undefined') {
        //most browsers except IE before #9
        return pageYOffset;
    } else {
        var B = document.body; //IE 'quirks'
        var D = document.documentElement; //IE with doctype
        D = (D.clientHeight) ? D : B;
        return D.scrollTop;
    }
};

Iconfirm.prototype.setAnimationPosition = function(){
    var el = false;
    if(this.animateFromElement && proxy.lastClicked){
        el = proxy.lastClicked;
        proxy.lastClicked = false;
    }

    if(!el.length){return false;}

    var offset = el.offset();
    var left   = (el.outerWidth() - this.$box.outerWidth()) / 2;
    var top    = (el.outerHeight() - this.$box.outerHeight()) / 2;

    left       = offset.left + left;
    top        = offset.top - this.scrollTop() + top;

    var winW = this.$win.width() / 2;
    var winH = this.$win.height() / 2;

    var targetW = winW - (this.$box.outerWidth() / 2);
    var targetH = winH - (this.$box.outerHeight() / 2);
    
    var sourceLeft = left - targetW;
    var sourceTop = top - targetH;

    this.$animation.css('transform', 'translate(' + sourceLeft + 'px, ' + sourceTop + 'px)');
};

Iconfirm.prototype.shake = function () {
    var that = this;

    if (that._hilightAnimating) {
        return;
    }

    that.$box.addClass('hilight-shake');
    that._hilightAnimating = true;
    setTimeout(function () {
        that._hilightAnimating = false;
        that.$box.removeClass('hilight-shake');
    }, 820);
};

Iconfirm.prototype.bindEvent = function () {    
    var that = this;

    var $target;
    that.$table.on('click', function (e) {
        $target = $(e.target);
        if (!$target.closest('.iconfirm__box').length) {
            if (that.backgroundDismiss) {
                that.close();
            } else {
                that.shake();
            }
        }
    });

    that.$win.on('resize', function (e) {
        that.resetDrag();
    });

};

Iconfirm.prototype.fixScrollbar = function(){
    var winH       = this.$win.height();
    var tableH = this.$table.height()

    // 如果容器高度大于window，说明出现了滚动条 所以给bg的right减去获取的滚动条宽度
    if(tableH - winH){
        var scrollbarW = this.measureScrollbarWidth();
        this.$bg.css("right", scrollbarW);
    }
};

Iconfirm.prototype.open = function () {
    var that = this;

    that.$box.removeClass('iconfirm__box--sacle');
    that.$bg.removeClass('iconfirm__bg--hidden');
    that.$animation.css('transform', 'translate(' + 0 + 'px, ' + 0 + 'px)');

    setTimeout(function () {
        if (typeof that.onOpen === 'function') {
            that.onOpen();
        }
    }, that.animationSpeed);
};

Iconfirm.prototype.close = function () {
    var that = this;

    this.$box.addClass('iconfirm__box--sacle');
    this.$bg.addClass('iconfirm__bg--hidden');

    setTimeout(function () {
        that.releaseHideBodyScrollBar();
        that.$confirm.remove();
    }, that.animationSpeed);
};

// ----------------------------------------------------------------------------------------
// 拖曳弹层

Iconfirm.prototype.resetDrag = function () {
    this.isPress = false;
    this.startPos = {
        x: 0,
        y: 0
    };
    this.currentPos = {
        x: 0,
        y: 0
    };
    this.lastPos = {
        x: 0,
        y: 0
    };

    this.$move.css({
        transform: 'translate(' + this.currentPos.x + 'px, ' + this.currentPos.y + 'px)'
    });
};

Iconfirm.prototype.setDraggable = function () {
    var that = this;

    this.resetDrag();
    this.$head.on('mousedown', function (e) {
        if (that.isPress) {
            return;
        }

        that.startPos = {
            x: e.clientX,
            y: e.clientY
        };

        that.isPress = true;

        return false;
    });

    $(document).on('mousemove', function (e) {
        if (!that.isPress) {
            return;
        }

        that.currentPos = {
            x: e.clientX - that.startPos.x + that.lastPos.x,
            y: e.clientY - that.startPos.y + that.lastPos.y
        };

        that.setDrag();

        return false;
    });

    $(document).on('mouseup', function (e) {
        if (!that.isPress) {
            return;
        }

        that.lastPos = {
            x: that.currentPos.x,
            y: that.currentPos.y
        };

        that.isPress = false;
    });

};

Iconfirm.prototype.setDrag = function () {
    var $box = this.$box, $table = this.$table, $window = this.$win;

    var winW       = $window.width();
    var winH       = $window.height();
    var boxW       = $box.width();
    var boxH       = $box.height();
    var tableH = $table.height()

    var minLeft    = (winW - boxW) / 2 - this.dragWindowGap;
    var minTop     = (winH - boxH) / 2 - this.dragWindowGap;
    var scrollTop  = (tableH - winH) / 2;

    if(this.currentPos.x + minLeft < 0){
        this.currentPos.x = -minLeft;
    }

    if(this.currentPos.x - minLeft > 0){
        this.currentPos.x = minLeft;
    }

    if((this.currentPos.y + minTop + scrollTop)  < 0){
        this.currentPos.y = -minTop -  scrollTop;
    }

    this.currentPos.x = parseInt(this.currentPos.x);
    this.currentPos.y = parseInt( this.currentPos.y);

    this.$move.css({
        transform: 'translate(' + this.currentPos.x + 'px, ' + this.currentPos.y + 'px)'
    });
};

// ----------------------------------------------------------------------------------------

Iconfirm.prototype.showLoading = function () {
    this.$box.addClass('loading');
};

Iconfirm.prototype.hideLoading = function () {
    this.$box.removeClass('loading');
};

Iconfirm.prototype.setAnimationCSS = function (speed) {
    var bounce = 1;
    var cubic_bezier = '0.36, 0.55, 0.19';

    return {
        '-webkit-transition-duration': speed / 1000 + 's',
        'transition-duration': speed / 1000 + 's',
        '-webkit-transition-timing-function': 'cubic-bezier(' + cubic_bezier + ', ' + bounce + ')',
        'transition-timing-function': 'cubic-bezier(' + cubic_bezier + ', ' + bounce + ')'
    };
};

$.prototype.iconfirm = function (options, options2) {

    options = buildOptions(options, options2);

    $(this).each(function () {
        var $this = $(this);

        if ($this.data('init')) { return; }

        $this.on('click', function () {
            $.iconfirm(options);
        });

        $this.data('init', true);
    });
};