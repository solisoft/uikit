import { Class, Priority } from '../mixin/index';
import { prepend, width, hasClass, $, $$, addClass, after, append, assign, css, height, includes, isRtl, isVisible, matches, noop, query, toFloat, Transition, within } from '../util/index';

export default function (UIkit) {

    UIkit.component('navbar', {

        mixins: [Class, {
            update: {

                write(data, update) {

                    delete this._computeds.layoutItems;
                    if (data.lastWidth !== this.$el.offsetWidth) {
                        data.lastWidth = this.$el.offsetWidth;

                        this.restoreOriginalNavbar();
                        const elementsChanged = this.updateStorage();
                        this.enablePrio = this.priorityShouldBeEnabled();

                        if (this.enablePrio && (this.temporaryList.length === 0 || elementsChanged)) {
                            this.moveElementsToTemporaryList();
                        } else {
                            //remove hidden elemetns to prevent "puBack" in priority code
                            this.hiddenElements = [];
                        }
                    } else if (!this.enablePrio) {
                        this.restoreOriginalNavbar();
                        this.enablePrio = this.priorityShouldBeEnabled();
                    }

                },
                events: ['load', 'resize']
            },
        }, Priority ],

        props: {
            dropdown: String,
            mode: 'list',
            align: String,
            offset: Number,
            boundary: Boolean,
            boundaryAlign: Boolean,
            clsDrop: String,
            delayShow: Number,
            delayHide: Number,
            dropbar: Boolean,
            dropbarMode: String,
            dropbarAnchor: 'query',
            duration: Number
        },

        defaults: {
            dropdownTemplate: '<div class="uk-navbar-dropdown"></div>',
            dropDownContainerClass: 'uk-nav uk-navbar-dropdown-nav',
            dropdown: '.uk-navbar-nav > li',
            align: !isRtl ? 'left' : 'right',
            clsDrop: 'uk-navbar-dropdown',
            mode: undefined,
            offset: undefined,
            delayShow: undefined,
            delayHide: undefined,
            boundaryAlign: undefined,
            flip: 'x',
            boundary: true,
            dropbar: false,
            dropbarMode: 'slide',
            dropbarAnchor: false,
            duration: 200,
            temporaryList: [],
            elementMappings: [],
            navBars: [],
            priorityBarNode: null,
            enablePrio: false
        },

        computed: {

            priorityList() {
                return this.prioBarMenu;
            },

            availableWidth() {
                return width(this.$el) - [this.prioBarItems, this.prioBarLogo].reduce((width, item) => width + item.getBoundingClientRect().width, 0);
            },

            allMenuElements() {
                return $$('.uk-navbar-nav > *, .uk-navbar-item', this.$el).filter(el => el !== this.moreNode);
            },

            prioBar() {

                if (!this.priorityBarNode) {
                    var position = 'center';
                    if ($('.uk-navbar-left', this.$el)) {
                        position = 'left';
                    } else if ($('.uk-navbar-right', this.$el)) {
                        position = 'right';
                    }

                    this.priorityBarNode = prepend(this.$el,
                        `<div class="uk-navbar-${position}">
                            <div class="uk-logo"></div>
                            <ul class="uk-navbar-nav"></ul>
                            <div class="uk-items"></div>
                        </div>`);
                }

                return this.priorityBarNode;
            },

            prioBarItems() {
                return $('.uk-items', this.prioBar);
            },

            prioBarLogo() {
                return $('.uk-logo', this.prioBar);
            },

            prioBarMenu() {
                return $('.uk-navbar-nav', this.prioBar);
            },

            layoutItems() {
                return $$('> [class^=uk-navbar-] > *', this.$el).map(item => ({item, bounds: item.getBoundingClientRect()}));
            },

            boundary({boundary, boundaryAlign}, $el) {
                return (boundary === true || boundaryAlign) ? $el : boundary;
            },

            pos({align}) {
                return `bottom-${align}`;
            }

        },

        ready() {
            if (this.dropbar) {
                UIkit.navbarDropbar(
                    query(this.dropbar, this.$el) || after(this.dropbarAnchor || this.$el, '<div></div>'),
                    {clsDrop: this.clsDrop, mode: this.dropbarMode, duration: this.duration, navbar: this}
                );
            }

        },

        update() {

            UIkit.drop(
                $$(`${this.dropdown} .${this.clsDrop}`, this.$el).filter(el => !UIkit.getComponent(el, 'dropdown')),
                assign({}, this.$props, {boundary: this.boundary, pos: this.pos})
            );

        },

        events: [

            {
                name: 'mouseover',

                delegate() {
                    return this.dropdown;
                },

                handler({current}) {
                    var active = this.getActive();
                    if (active && active.toggle && !within(active.toggle.$el, current) && !active.tracker.movesTo(active.$el)) {
                        active.hide(false);
                    }
                }

            }

        ],

        methods: {

            isLogo(el) {
                return hasClass(el, 'uk-logo') || $('.uk-logo', el);
            },

            isItem(el) {
                return hasClass(el, 'uk-navbar-item') || $('.uk-navbar-item', el);
            },

            moveElementsToTemporaryList() {

                this.temporaryList = this.elementMappings.slice();

                this.temporaryList.forEach(item => {
                    if (this.isLogo(item.el)) {
                        append(this.prioBarLogo, item.el);
                    } else if (this.isItem(item.el)) {
                        append(this.prioBarItems, item.el);
                    } else {
                        append(this.prioBarMenu, item.el);
                    }
                });

                this.navBars = $$('> [class^=uk-navbar-]', this.$el);
                this.navBars.forEach(bar => bar.remove());

                append(this.$el, this.prioBar);

            },

            restoreOriginalNavbar() {
                this.prioBar.remove();
                this.temporaryList.sort((a, b) => a.index - b.index)
                                  .forEach(item => {
                                      append(item.sourceNode, item.el);
                                  });

                this.temporaryList = [];

                this.navBars.forEach(item => {
                    append(this.$el, item);
                });

                this.navBars = [];

            },

            priorityShouldBeEnabled() {
                const items = this.layoutItems.slice().sort((a, b) => a.bounds.left - b.bounds.left);
                var prev;
                const overLaps = items.some(item => {const overlaps = prev && item.bounds.left < prev.bounds.right; prev = item; return overlaps;});
                const tooBig = items.reduce((right, trans) => Math.max(right, trans.bounds.right), 0) > this.$el.getBoundingClientRect().right;
                return tooBig || overLaps;
            },

            updateStorage() {

                var changed;
                this.allMenuElements.forEach(el => {

                    if (!this.elementMappings.some(item => el === item.el)) {
                        this.elementMappings.push({
                            el,
                            sourceNode: el.parentNode,
                            index: Array.prototype.indexOf.call(el.parentNode.childNodes, el)//.in
                        });
                        changed |= true;
                    }

                });

                return changed;
            },

            useWidth() {
                return true;
            },

            priorityEnabled() {
                return this.enablePrio;
            },

            getActive() {
                var active = UIkit.drop.getActive();
                return active && includes(active.mode, 'hover') && within(active.toggle.$el, this.$el) && active;
            }

        }

    });

    UIkit.component('navbar-dropbar', {

        mixins: [Class],

        defaults: {
            clsDrop: '',
            mode: 'slide',
            navbar: null,
            duration: 200
        },

        init() {

            if (this.mode === 'slide') {
                addClass(this.$el, 'uk-navbar-dropbar-slide');
            }

        },

        events: [

            {
                name: 'beforeshow',

                el() {
                    return this.navbar.$el;
                },

                handler(e, drop) {
                    var {$el, dir} = drop;
                    if (dir === 'bottom' && !within($el, this.$el)) {
                        append(this.$el, $el);
                        drop.show();
                        e.preventDefault();
                    }
                }
            },

            {
                name: 'mouseleave',

                handler() {
                    var active = this.navbar.getActive();

                    if (active && !matches(this.$el, ':hover')) {
                        active.hide();
                    }
                }
            },

            {
                name: 'show',

                handler(_, {$el}) {
                    this.clsDrop && addClass($el, `${this.clsDrop}-dropbar`);
                    this.transitionTo($el.offsetHeight + toFloat(css($el, 'margin-top')) + toFloat(css($el, 'margin-bottom')));
                }
            },

            {
                name: 'beforehide',

                handler(e, {$el}) {

                    var active = this.navbar.getActive();

                    if (matches(this.$el, ':hover') && active && active.$el === $el) {
                        e.preventDefault();
                    }
                }
            },

            {
                name: 'hide',

                handler(_, {$el}) {

                    var active = this.navbar.getActive();

                    if (!active || active && active.$el === $el) {
                        this.transitionTo(0);
                    }
                }
            }

        ],

        methods: {

            transitionTo(newHeight) {
                height(this.$el, isVisible(this.$el) ? height(this.$el) : 0);
                Transition.cancel(this.$el);
                return Transition.start(this.$el, {height: newHeight}, this.duration).catch(noop);
            }

        }

    });

}
