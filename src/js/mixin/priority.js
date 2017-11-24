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

        temporaryNode() {
            return this.useListItems() ? this.subListNode : this.subDivNode;
        },

        targetNode() {
            return this.list;
        },

        container() {
            return this.$el.parentNode;
        },

        moreNode() {
            if (!this._moreNode) {
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

        getCurrentWidth() {
            return this.currentElements.reduce((width, {el}) => width + el.offsetWidth, 0) + (this.currentElements.length < this.allElements.length ? this.moreNode.offsetWidth : 0);
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
            return this.targetNode.nodeName === 'UL';
        },

        shouldShrink(parentWidth) {
            return this.currentElements.length && (this.useWidth() ? this.getCurrentWidth() > parentWidth : this.hasBreakingElement());
        },

        getAllElements() {
            return util.toNodes(this.list.childNodes)
                       .filter(el => el !== this.moreNode && el.nodeType !== Node.TEXT_NODE)
                       .map(el => ({el, origin: this.list}));
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

        getParentWidth() {
            return util.width(this.container);
        },

        canGrow() {
            if (this.hiddenElements.length) {
                const node = this.hiddenElements[0];
                util.append(node.origin, node.el);
                this.currentElements.push(node);
                const parentWidth = this.getParentWidth();
                const neededWidth = this.getCurrentWidth();
                const stillFits = neededWidth <= parentWidth;
                // if (stillFits) debugger;
                this.currentElements.pop();
                this.storeNode(node);
                return stillFits;
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

        resize(data, parentWidth) {

            data.lastParentWidth = parentWidth;
            
            this.putBack();

            data.growCheck = true;
            // while (this.currentElements.length && this.getCurrentWidth() > parentWidth) {
            while (this.shouldShrink(parentWidth)) {
                
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

                //update all elements to captue lately added elements
                const collectionUpdated = this.updateCollection();

                const parentWidth = util.width(this.container);
                if (collectionUpdated || data.lastParentWidth !== parentWidth) {

                    this.resize(data, parentWidth);

                } else if (data.growCheck) {

                    if (this.canGrow()) {
                        debugger;
                        this.resize(data, parentWidth);
                    }
                    data.growCheck = false;
                }

            } else {
                this.putBack();
            }

        },
        events: ['load', 'resize']
    }
};