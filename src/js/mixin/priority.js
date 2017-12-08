import { prepend, append, $, width, toNodes, $$ } from '../util/index';
export default {

    props: {
        priorityText: String
    },

    defaults: {
        priorityText: 'more',
        placeholderTemplate: '<a href=""></a>',
        dropdownTemplate: '<div uk-dropdown></div>',
        dropDownContainerClass: 'uk-nav uk-dropdown-nav',
        hiddenElements: [],
        allElements: [],
        currentElements: []
    },

    computed: {

        priorityList() {
            return this.$el;
        },

        //the node to place menu items into
        temporaryNode() {
            return this.moreNode.lastChild.firstChild;
        },

        moreNode() {
            if (!this._moreNode && this.priorityList) {
                const useUl = this.priorityList.nodeName === 'UL';
                const containerTag = useUl ? 'ul' : 'div';
                const contentTag = useUl ? 'li' : 'div';
                this._moreNode = append(this.priorityList, `<${contentTag} class="uk-more"></${contentTag}>`);
                append(this._moreNode, this.placeholderTemplate).textContent = this.priorityText;
                const dropDown = append(this._moreNode, this.dropdownTemplate);
                append(dropDown, `<${containerTag} class="${this.dropDownContainerClass}"></${containerTag}>`);
                this._moreNode.remove();
            }
            return this._moreNode;
        },

        moreNodeWidth() {
            return this.moreNode.getBoundingClientRect().width;
        },

        availableWidth() {
            return width(this.$el);
        }

    },

    methods: {

        neededWidth() {
            const w = this.currentElements.reduce((width, el) => width + (el.width || (el.width = el.el.getBoundingClientRect().width)), 0);
            return w + (this.currentElements.length < this.allElements.length ? this.moreNodeWidth : 0);
        },

        showMore() {
            return this.currentElements.length < this.allElements.length;
        },

        hasBreakingElement() {
            var prevElement = null;
            var elements = this.showMore() ? this.currentElements.concat([{el: this.moreNode}]) : this.currentElements;
            return elements.some(el => {

                el.top = el.top || el.el.offsetTop;
                if (prevElement) {
                    prevElement.height = prevElement.height || prevElement.el.offsetHeight;
                    return el.top >= (prevElement.top + prevElement.height);
                }
                prevElement = el;
            });
        },

        canBePrioritized(el) {
            return !$('.uk-navbar-dropdown', el);
        },

        shouldShrink() {
            return this.currentElements.length && (this.useWidth() ? this.neededWidth() > this.availableWidth : this.hasBreakingElement());
        },

        getAllElements() {
            return toNodes(this.priorityList.childNodes)
                .filter(el => el !== this.moreNode && el.nodeType == Node.ELEMENT_NODE)
                .map(el => ({el}));
        },

        updateCollection() {

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
            return true;
        },

        restoreOriginalPriobar() {

            if (this.hiddenElements.length) {
                //append all to ensure correct order
                this.allElements.forEach(node => {
                    append(this.priorityList, node.el);
                });

            }

            this.currentElements = this.allElements.concat();
            this.hiddenElements = [];

            if (this.moreNode) {
                this.moreNode.remove();
            }

            this.resetMeasurements();
        },

        resetMeasurements() {
            this.currentElements.forEach(el => {
                delete el.width;
                delete el.top;
                delete el.height;
            });
            delete this._moreNodeBounds;
        },

        getNextItemToRemove() {

            for (var i = 0 ; i < this.currentElements.length; i++) {
                const index = this.currentElements.length - i - 1;
                const overHangingChild = this.currentElements[index];
                if (this.canBePrioritized(overHangingChild.el)) {
                    this.currentElements.splice(index, 1);
                    return overHangingChild;
                }
            }
        },

        resize() {

            const oldSize = this.currentElements.length;

            this.restoreOriginalPriobar();

            while (this.shouldShrink()) {

                append(this.priorityList, this.moreNode);
                const overHangingChild = this.getNextItemToRemove();
                if (overHangingChild) {
                    this.hiddenElements.unshift(overHangingChild);
                    prepend(this.temporaryNode, overHangingChild.el);
                } else {
                    break;
                }
            }

            const newSize = this.currentElements.length;

            if (newSize === oldSize) {

                this.temporaryNode.ukNoUpdate = true;
                this.priorityList.ukNoUpdate = true;
				//prevent all icons from triggering updates
                $$('.uk-icon', this.$el).forEach(el => el.ukNoUpdate = true);
            }
        }

    },

    update: {

        write() {

            if (this.priorityEnabled()) {

                delete this._computeds.availableWidth;
                this.updateCollection();
                this.resize();

            } else {
                this.restoreOriginalPriobar();
            }

        },
        events: ['load', 'resize']
    }
};
