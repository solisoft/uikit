import { Togglable, Priority } from '../mixin/index';
import { $$, addClass, attr, data, filter, getIndex, hasClass, index, isTouch, matches, queryAll, removeClass, win } from '../util/index';

export default function (UIkit) {

    UIkit.component('switcher', {

        // mixins: [Togglable],
        mixins: [Togglable, Priority],

        args: 'connect',

        props: {
            connect: String,
            toggle: String,
            active: Number,
            swiping: Boolean
        },

        defaults: {
            connect: '~.uk-switcher',
            toggle: '> .uk-more > .uk-dropdown > * > *, > *:not(.uk-more)',
            active: 0,
            swiping: true,
            cls: 'uk-active',
            clsContainer: 'uk-switcher',
            attrItem: 'uk-switcher-item',
            queued: true
        },

        computed: {

            connects({connect}, $el) {
                return queryAll(connect, $el);
            },

            toggles({toggle}, $el) {
                return $$(toggle, $el);
            }

        },

        events: [

            {

                name: 'click',

                delegate() {

                    const selector = `${this.toggle}`.split(',').map(part => `${part}:not(.uk-disabled)`).join(',');
                    return selector;
                },

                handler(e) {
                    if (e.defaultPrevented) return;
                    e.preventDefault();
                    this.show(e.current);
                }

            },

            {
                name: 'click',

                el() {
                    return this.connects;
                },

                delegate() {
                    return `[${this.attrItem}],[data-${this.attrItem}]`;
                },

                handler(e) {
                    if (e.defaultPrevented) return;
                    e.preventDefault();
                    this.show(data(e.current, this.attrItem));
                }
            },

            {
                name: 'swipeRight swipeLeft',

                filter() {
                    return this.swiping;
                },

                el() {
                    return this.connects;
                },

                handler(e) {
                    if (!isTouch(e)) {
                        return;
                    }

                    e.preventDefault();
                    if (!win.getSelection().toString()) {
                        this.show(e.type === 'swipeLeft' ? 'next' : 'previous');
                    }
                }
            }

        ],

        update() {

            this.connects.forEach(list => this.updateAria(list.children));
            this.show(filter(this.toggles, `.${this.cls}`)[0] || this.toggles[this.active] || this.toggles[0]);

        },

        methods: {

            priorityEnabled() {
                var enabled = !UIkit.util.hasClass(this.list, 'uk-nav');
                this.$options.mixins.forEach(mixin => {
                    if (mixin.methods && mixin.methods.priorityEnabled) {
                        enabled &= mixin.methods.priorityEnabled.call(this);
                    }
                });
                return enabled;
            },

            show(item) {

                var length = this.toggles.length,
                    prev = !!this.connects.length && index(filter(this.connects[0].children, `.${this.cls}`)[0]),
                    hasPrev = prev >= 0,
                    next = getIndex(item, this.toggles, prev),
                    dir = item === 'previous' ? -1 : 1,
                    toggle;

                for (var i = 0; i < length; i++, next = (next + dir + length) % length) {
                    if (!matches(this.toggles[next], '.uk-disabled, [disabled]')) {
                        toggle = this.toggles[next];
                        break;
                    }
                }

                if (!toggle || prev >= 0 && hasClass(toggle, this.cls) || prev === next) {
                    return;
                }

                removeClass(this.toggles, this.cls);
                attr(this.toggles, 'aria-expanded', false);
                addClass(toggle, this.cls);
                attr(toggle, 'aria-expanded', true);

                this.connects.forEach(list => {
                    if (!hasPrev) {
                        this.toggleNow(list.children[next]);
                    } else {
                        this.toggleElement([list.children[prev], list.children[next]]);
                    }
                });

            }

        }

    });

}
