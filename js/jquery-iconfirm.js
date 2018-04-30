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
    if (!isObject(buttons)) {
        return [];
    }

    var arr = [];
    $.each(buttons, function () {
        arr.push(this);
    });

    return arr;
};

var getObjectOfIndex = function (obj, index) {
    var count = 0, res = null;

    $.each(obj, function () {
        // 如果当前遍历到的index === 要找的index
        if (count === index) {
            res = this;
            return false;
        }
        count++;
    });

    return res;
};

var getTypeButton = function (options, type) {
    if (!options || !type) {
        return {};
    }

    switch (type) {
        case 'confirm':
            var buttons = {};
            var enableDefaultButtons = options['buttons'] !== false;

            if (typeof options['buttons'] !== 'object') {
                buttons = {};
            }

            var len = getObjectKeys(buttons).length;
            if (len === 0 && enableDefaultButtons) {
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

            if (len === 0 && enableDefaultButtons) {
                var newButtons = $.extend(true, {}, proxy.defaults.defaultButtons);
                var first = getObjectOfIndex(newButtons, 0);
                buttons[first] = first;
            }

            return buttons;
        case 'dialog':
            return {};
    }

    return {};
};

$.iconfirm = function (options, options2) {
    options = buildOptions(options, options2);

    options['buttons'] = getTypeButton(options, 'confirm');

    proxy(options);
};

$.ialert = function (options, options2) {
    options = buildOptions(options, options2);

    options['buttons'] = getTypeButton(options, 'alert');

    proxy(options);
};

$.idialog = function (options, options2) {
    options = buildOptions(options, options2);

    options['buttons'] = getTypeButton(options, 'idialog');

    proxy(options);
};

var proxy = function (options) {
    if (typeof options === 'undefined') {
        options = {};
    }

    var pluginOptions = $.extend(true, {}, proxy.defaults, options);

    new Iconfirm(pluginOptions);
};

proxy.lastClicked = false;

$(document).on('mousedown', 'button, a', function () {
    proxy.lastClicked = $(this);
});

proxy.defaults = {
    title: '',
    content: '',
    container: 'body',
    animationSpeed: 400,
    slogan: false,
    backgroundDismiss: true,
    dragWindowGap: 20,
    animateFromElement: true,
    buttons: {

    },
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
    onOpen: function () {

    }
};


function Iconfirm(options) {
    var template = '<div class="iconfirm">' +
        '<div class="iconfirm__bg modal__bg--hidden"></div>' +
        '<div class="iconfirm__container">' +
        '<div class="iconfirm__cell">' +
        '<div class="iconfirm__move-container">' +
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
        '</div>' +
        '</div>';

    this.options = options;
    this.$template = $(template);

    $.extend(this, options);

    this.init();
}

Iconfirm.prototype.init = function () {
    this.buildUI();
    this.bindEvent();
    this.open();
};

Iconfirm.prototype.buildUI = function () {
    var self = this;
    var $template = this.$template;

    this.$bg            = $template.find('.iconfirm__bg');
    this.$title         = $template.find('.iconfirm__title');
    this.$cell          = $template.find('.iconfirm__cell');
    this.$content       = $template.find('.iconfirm__content');
    this.$wrap          = $template.find('.iconfirm__wrap');
    this.$head          = $template.find('.iconfirm__head');
    this.$slogan        = $template.find('.iconfirm__slogan');
    this.$buttons       = $template.find('.iconfirm__buttons');
    this.$closeIcon     = $template.find('.iconfirm__close-icon');
    this.$container     = $template.find('.iconfirm__container');
    this.$moveContainer = $template.find('.iconfirm__move-container');
    this.$confirm       = $template.appendTo(this.options.container);

    this.contentReady = $.Deferred();

    if (this.options.titleClass) {
        this.$title.addClass(this.options.titleClass)
    }

    this.setStartingPosition();

    if (this.width) {
        this.$wrap.css('width', this.width);
    }

    this.setTitle();
    this.setSlogan();
    this.setContent();
    this.setButtonts();
    this.setDraggable();

    if (this.options.isAjax) {
        this.showLoading();
    }

    $.when(this.contentReady).then(function () {
        if (self.isAjaxLoading) {
            // 异步处理内容
        } else {
            // 同步处理内容
        }
    });

    // 执行动画效果
    this.$bg.css(this.setAnimationCSS(this.options.animationSpeed, 1));
    this.$wrap.css(this.setAnimationCSS(this.options.animationSpeed, 1));
    this.$cell.css(this.setAnimationCSS(this.options.animationSpeed, 1));
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

Iconfirm.prototype.setStartingPosition = function(){
    var el = false;
    if(this.animateFromElement && proxy.lastClicked){
        el = proxy.lastClicked;
        proxy.lastClicked = false;
    }

    if(!el){return false;}

    // 获取按钮的offset 相对于文档 也就是document的位置
    var offset = el.offset();

    var left = (el.outerWidth() - this.$wrap.outerWidth()) / 2;
    var top = (el.outerHeight() - this.$wrap.outerHeight()) / 2;

    left = offset.left + left;
    top = offset.top - this.scrollTop() + top;

    var winW = $(window).width() / 2;
    var winH = $(window).height() / 2;

    var targetW = winW - (this.$wrap.outerWidth() / 2);
    var targetH = winH - (this.$wrap.outerHeight() / 2);
    
    var sourceLeft = left - targetW;
    var sourceTop = top - targetH;

    this.$cell.css('transform', 'translate(' + sourceLeft + 'px, ' + sourceTop + 'px)');
};
Iconfirm.prototype.shake = function () {
    var that = this;

    if (that._hilightAnimating) {
        return;
    }

    that.$wrap.addClass('hilight-shake');
    this._hilightAnimating = true;
    setTimeout(function () {
        that._hilightAnimating = false;
        that.$wrap.removeClass('hilight-shake');
    }, 820);
};

Iconfirm.prototype.bindEvent = function () {
    var that = this;

    var $target;
    that.$container.on('click', function (e) {
        $target = $(e.target);
        if (!$target.closest('.iconfirm__wrap').length) {
            if (that.backgroundDismiss) {
                that.close();
            } else {
                that.shake();
            }
        }
    });

    $(window).on('resize', function (e) {
        that.resetDrag();
    });

};

Iconfirm.prototype.setTitle = function () {
    this.$title.html(this.options.title);
};

Iconfirm.prototype.setSlogan = function () {
    if (!this.slogan) {
        this.$slogan.hide();
        return;
    }
    this.$slogan.html(this.slogan);
};

Iconfirm.prototype.setContent = function () {
    this.$content.html(this.options.content);
};

Iconfirm.prototype.setButtonts = function () {
    var self = this;

    var buttons = this.buttons;

    var buttons_count = 0;
    if (typeof buttons !== 'object') {
        buttons = {};
    }

    $.each(buttons, function (key, button) {
        buttons_count++;


        // 包装用户传入的参数 如果不是预期的格式
        if (typeof button === 'function') {
            self.options.buttons[key] = button = {
                action: button
            };
        }

        buttons[key].text = button.text || key;
        buttons[key].btnClass = button.btnClass || 'btn-default';
        // 如果用户没有传入action 这赋值一个空的函数来替代
        buttons[key].action = button.action || function () {};

        buttons[key].keys = button.keys || [];
        buttons[key].isHidden = button.isHidden || false;
        buttons[key].isDisabled = button.isDisabled || false;

        $.each(buttons[key].keys, function (i, a) {
            buttons[key].keys[i] = a.toLowerCase();
        });

        var button_element = $('<button type="button" class="iconfirm__btn"></button>')
            .html(buttons[key].text)
            .addClass(buttons[key].btnClass)
            .prop('disabled', buttons[key].isDisabled)
            .css('display', buttons[key].isHidden ? 'none' : '')
            .click(function (e) {
                e.preventDefault();
                // 执行传入的action函数 
                var res = buttons[key].action.apply(self, [buttons[key]]);

                if (typeof res === 'undefined' || res) {
                    self.close();
                }
            });

        self.$buttons.append(button_element);

    });

    if (buttons_count === 0) this.$buttons.hide();

    if (buttons_count > 1) {
        self.$buttons.addClass('iconfirm__buttons--multipe');
    }

    self.$closeIcon.on('click', function (e) {
        self.close();
    });
};

Iconfirm.prototype.open = function () {
    var that = this;
    this.$wrap.offset();

    this.$wrap.removeClass('iconfirm__wrap--sacle');
    this.$bg.removeClass('modal__bg--hidden');

    this.$cell.css('transform', 'translate(' + 0 + 'px, ' + 0 + 'px)');


    var winH = $(window).height();

    var containerH = that.$container.height()

    // 如果容器高度大于window，说明出现了滚动条 所以给bg的right减去获取的滚动条宽度
    if(containerH - winH){
        var scrollbarW = this.measureScrollbarWidth();

        this.$bg.css("right", scrollbarW);
    }


    setTimeout(function () {
        if (typeof that.onOpen === 'function') {
            that.onOpen();
        }


    }, that.options.animationSpeed);
};

Iconfirm.prototype.close = function () {
    var that = this;

    this.$wrap.addClass('iconfirm__wrap--sacle');
    this.$bg.addClass('modal__bg--hidden');

    setTimeout(function () {

        that.$confirm.remove();

    }, that.options.animationSpeed);
};

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

    this.$moveContainer.css({
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
    var $box = this.$wrap, $container = this.$container, $window = $(window);

    var winW       = $window.width();
    var winH       = $window.height();
    var boxW       = $box.width();
    var boxH       = $box.height();
    var containerH = $container.height()

    var minLeft = (winW - boxW) / 2 - this.dragWindowGap;
    var minTop  = (winH - boxH) / 2 - this.dragWindowGap;
    var scrollTop = (containerH - winH) / 2;

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

    this.$moveContainer.css({
        transform: 'translate(' + this.currentPos.x + 'px, ' + this.currentPos.y + 'px)'
    });
};

Iconfirm.prototype.showLoading = function () {};

Iconfirm.prototype.hideLoading = function () {};

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

Iconfirm.prototype.example = function () {

};

$.prototype.iconfirm = function (options, options2) {
    if (typeof options === 'undefined') {
        options = {};
    }

    if (typeof options === 'string') {
        options = {
            content: options,
            title: options2 ? options2 : false
        };
    }

    $(this).each(function () {
        var $this = $(this);
        if ($this.data('init')) {
            return;
        }

        $this.on('click', function () {
            $.iconfirm(options);
        });

        $this.data('init', true);
    });
};