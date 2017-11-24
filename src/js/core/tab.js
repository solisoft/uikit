import { Class } from '../mixin/index';
import { hasClass } from '../util/index';

export default function (UIkit) {

    UIkit.component('tab', UIkit.components.switcher.extend({

        mixins: [Class],

        name: 'tab',

        props: {
            media: 'media'
        },

        defaults: {
            media: 960,
            attrItem: 'uk-tab-item',
            mediaToggler: null
        },

        methods: {

            priorityEnabled() {
                var enabled = !this.mediaToggler || !this.mediaToggler.isToggled();
                enabled &= UIkit.components.switcher.options.methods.priorityEnabled.call(this);
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
