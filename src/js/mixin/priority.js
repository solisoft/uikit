import * as util from '../util/index';
import UIkit from '../api/index';

export default {

    props: {
        placeholderTemplate: '',
        dropdownTemplate: ''
    },

    defaults: {
        placeholderTemplate: '<span uk-icon="icon: more-vertical"></span>',
        dropdownTemplate: '<div uk-dropdown></div>',
        hiddenElements: [],
        allElements: [],
        currentElements: [],
    },

    computed: {
        list() {
            return this.$el;
        },

        priorityLists() {
            return [this.list];
        },

        temporaryNode() {
            return this.useListItems() ? this.subListNode : this.subDivNode;
        },

        targetNode() {
            return this.list;
        },

        container() {
            return this.$el;
        },

        moreNode() {
            if (!this._moreNode && this.targetNode) {
                const useList = this.useListItems();
                const elTypeItem = useList ? 'li' : 'div';
                const elTypeContainer = useList ? 'ul' : 'div';
                this._moreNode = util.append(this.targetNode, `<${elTypeItem} class="uk-more"></${elTypeItem}>`);
                util.append(this._moreNode, this.placeholderTemplate);
                const dropDown = util.append(this._moreNode, this.dropdownTemplate);
                util.append(dropDown, `<${elTypeContainer}></${elTypeContainer}>`);
                this._moreNode.remove();
            }
            return this._moreNode;
        },

        dropNode() {
            return UIkit.util.$('[uk-dropdown]', this.moreNode);
        },

        subListNode() {
            return UIkit.util.$('> ul', this.dropNode);
        },

        subDivNode() {
            return UIkit.util.$('> div', this.dropNode);
        }

    },

    methods: {

        parentWidth() {
            const pw = this.container.clientWidth;
            const pw2 = UIkit.util.width(this.container);//.clientWidth;
            // console.log('pw',pw,'pw2',pw2);
            // if(pw > pw2) debugger;
            return Math.max(pw2, pw);
        },

        getAvailableWidth(list) {
            return this.parentWidth();
        },

        getNeededWidth() {
            const w = this.currentElements.reduce((width, {el}) => width + el.offsetWidth, 0) + (this.currentElements.length < this.allElements.length ? this.moreNode.offsetWidth : 0);
            return w;
        },

        showMore() {
            return this.currentElements.length < this.allElements.length;
        },

        hasBreakingElement() {
            var prevElement = null;
            var elements = this.showMore() ? this.currentElements.concat([{el: this.moreNode}]) : this.currentElements;
            return elements.some(({el}) => {

                if (prevElement) {
                    return el.offsetTop >= (prevElement.offsetTop + prevElement.offsetHeight);
                }
                prevElement = el;
            });
        },

        useListItems() {
            return this.targetNode && this.targetNode.nodeName === 'UL';
        },

        shouldShrink() {
            return this.currentElements.length && (this.useWidth() ? this.getNeededWidth() > this.getAvailableWidth() : this.hasBreakingElement());
        },

        getAllElements() {
            var els = [];
            this.priorityLists.forEach(list => {
                els = els.concat(UIkit.util.toNodes(list.childNodes)
                                            .filter(el => el !== this.moreNode && el.nodeType == Node.ELEMENT_NODE)
                                            .map(el => ({el, origin: list})));
            });

            return els;
        },

        updateCollection(data) {

            var changed = false;

            this.getAllElements().forEach(source => {
                if (!this.allElements.some(store => store.el === source.el)) {
                    this.allElements.push(source);
                    changed = true;
                }
            });

            return changed;
        },

        useWidth() {
            return this.currentElements.length === 1;
        },

        priorityEnabled() {
            //only works for ul's
            return this.useListItems();
        },

        isMenuEntry(el) {
            return true;
        },

        shrinkFromRight() {
            return true;
        },

        putOneEntryBack() {
            const node = this.hiddenElements[0];
            util.append(node.origin, node.el);
            this.currentElements.push(node);
            return node;
        },

        removeOneEntry() {
            const node = this.currentElements.pop();
            this.storeNode(node);
        },

        getAvailableSpace() {
            return this.parentWidth() - this.getNeededWidth();
        },

        mightGrow() {
            return true;
        },

        canGrow() {
            if (this.hiddenElements.length) {

                this.putOneEntryBack();
                const space = this.getAvailableSpace();
                this.removeOneEntry();

                return space >= 0;
            }
        },

        storeNode(overHangingChild) {
            if (this.isMenuEntry(overHangingChild)) {
                const method = this.shrinkFromRight() ? 'prepend' : 'append';
                util[method](this.temporaryNode, overHangingChild.el);
            } else {
                overHangingChild.el.remove();
            }
        },

        putBack() {

            this.hiddenElements.forEach(node => {
                util.append(node.origin, node.el);
            });

            this.moreNode && this.moreNode.remove();
            this.currentElements = Array.from(this.allElements);
            this.hiddenElements = [];
        },

        resize() {

            this.putBack();

            while (this.shouldShrink()) {

                const fromRight = this.shrinkFromRight();
                const overHangingChild = fromRight ? this.currentElements.pop() : this.currentElements.shift();
                this.hiddenElements.unshift(overHangingChild);
                util.append(this.targetNode, this.moreNode);

                this.storeNode(overHangingChild);
            }
        }

    },

    update: {

        write(data, update) {

            if (this.priorityEnabled()) {

                const collectionUpdated = this.updateCollection();

                if (collectionUpdated || data.lastParentWidth !== this.parentWidth()) {
                    this.resize();
                } else if (data.skipGrowCeck) {
                    // console.log('skipped...');
                    delete data.skipGrowCeck;// = false;
                } else if (this.mightGrow() && this.canGrow()) {
                    this.resize();
                } else {
                    data.skipGrowCeck = true;
                }

                data.lastParentWidth = this.parentWidth();

            } else {
                this.putBack();
            }

        },
        events: ['load', 'resize']
    }
};