import Priority from '../mixin/priority';

function plugin(UIkit) {

    if (plugin.installed) {
        return;
    }

    UIkit.component('priority', {

        mixins: [Priority],

        connected() {

        },

    });
}

export default plugin;