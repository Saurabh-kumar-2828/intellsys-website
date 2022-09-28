export function ItemBuilder<T>(props: {
    items: Array<T>,
    itemBuilder: (item: T, itemIndex: number) => JSX.Element,
    spaceBuilder?: ((spaceIndex: number) => JSX.Element),
}) {
    const items = props.items;
    const itemBuilder = props.itemBuilder;
    const spaceBuilder = props.spaceBuilder;

    const returnValue = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const item = items[itemIndex];

        returnValue.push(itemBuilder(item, itemIndex));

        if (spaceBuilder != null) {
            if (itemIndex != items.length - 1) {
                returnValue.push(spaceBuilder(itemIndex + 0.5));
            }
        }
    }

    return <>
        {returnValue}
    </>;
};
