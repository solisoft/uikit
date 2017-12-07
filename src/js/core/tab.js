import { Class, Priority } from '../mixin';
import { hasClass } from '../util';

export default function (UIkit) {

    UIkit.component('tab', UIkit.components.switcher.extend({

        mixins: [Class, Priority],

        name: 'tab',

        props: {
            media: 'media'
        },

        defaults: {
            media: 960,
            attrItem: 'uk-tab-item',
            mediaToggler: null,
            toggle: '> .uk-more > .uk-dropdown > * > *, > *:not(.uk-more)',
        },

        methods: {

            priorityEnabled() {
                var enabled = !this.mediaToggler || !this.mediaToggler.isToggled();

                this.$options.mixins.forEach(mixin => {
                    if (mixin.methods && mixin.methods.priorityEnabled) {
                        enabled &= mixin.methods.priorityEnabled.call(this);
                    }
                });

                return enabled;
            },
        },

        init() {

            var cls = hasClass(this.$el, 'uk-tab-left')
                ? 'uk-tab-left'
                : hasClass(this.$el, 'uk-tab-right')
                    ? 'uk-tab-right'
                    : false;

            if (cls) {
                this.mediaToggler = UIkit.toggle(this.$el, {cls, mode: 'media', media: this.media});
            }
        }

    }));

}
