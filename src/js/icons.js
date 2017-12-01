import Icons from 'icons';
function plugin(UIkit) {

    if (plugin.installed) {
        return;
    }

    Object.keys(Icons).forEach(name => {
        const icon = Icons[name];
        if (icon[0] === '#') {
            Icons[name] = `SVG_HEADER${icon.substr(1)}</svg>`;
        }
    });

    UIkit.icon.add(Icons);

}

if (typeof window !== 'undefined' && window.UIkit) {
    window.UIkit.use(plugin);
}

export default plugin;
