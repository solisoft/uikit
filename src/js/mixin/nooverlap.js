// import { transition } from "../util/index";

export default {

    computed: {
        overlappingItems() {
            throw 'overlapping items must be override';
        }
    },

    methods: {

        preventOverlapEnabled() {
            return true;
        },

        preventOverlap() {
            var spaceAvailable = 0;
            var right = 0;
            //filter 'double' entries
            var items = this.overlappingItems.filter(parent => !this.overlappingItems.some(node => parent !== node && parent.contains(node)));
            //reset items
            items.forEach(item => item.style.transform = '');
            var translations = items.map(item => ({item, bounds: item.getBoundingClientRect()}))
                                    .sort((a, b) => a.bounds.left - b.bounds.left);

            translations.forEach((translation) => {

                const box = translation.bounds;
                const overLap = right ? right - box.left : 0;

                // if (!right) {
                right = box.right;
                // }

                if (overLap > 0) {
                    translation.x = overLap;
                    right += overLap;

                } else {
                    translation.x = 0;
                    translation.space = -overLap;
                    spaceAvailable -= overLap;
                    // right = box.right;
                }

            });

            var overlapsRight = right - this.$el.getBoundingClientRect().right;

            translations.slice().reverse().some(item => {
                const index = translations.indexOf(item);
                if (index > 0 && item.space && spaceAvailable > 0 && overlapsRight > 0) {
                    const avilableSpace = item.space;
                    const usedFillSpace = Math.min(avilableSpace, overlapsRight);
                    spaceAvailable -= usedFillSpace;
                    overlapsRight -= usedFillSpace;
                    translations.slice(index).forEach(item => {
                        item.x -= usedFillSpace;
                    });
                }

                return spaceAvailable === 0;
            });

            translations.forEach(item => {
                item.item.style.transform = `translateX(${item.x}px)`;
            });

        }
    },

    update: {
        write() {
            if (this.preventOverlapEnabled()) {
                this.preventOverlap();
            }
        },
        events: ['load', 'resize']
    }
};