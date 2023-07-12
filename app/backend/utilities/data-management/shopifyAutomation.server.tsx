import {Iso8601DateTime} from "~/utilities/typeDefinitions";
import format from "pg-format";

type amount = {amount: string; currencyCode: string};
type paymentObject = {presentmentMoney: amount; shopMoney: amount};
type orderObject = {
    id: string;
    tags: Array<string>;
    updatedAt: Iso8601DateTime;
    createdAt: Iso8601DateTime;
    netPaymentSet: paymentObject;
    customer: string;
    customerJourneySummary: object;
    shippingAddress: object;
    subtotalLineItemsQuantity: number;
    lineItems?: Array<lineItemObject>;
};

type lineItemObject = {
    id: string;
    sku: string;
    name: string;
    product: object;
    variant: object;
    variantTitle: string;
    quantity: number;
    originalTotalSet: paymentObject;
    originalUnitPriceSet: paymentObject;
    __parentId: string;
};

async function insertIntoTable(tableName: string, tableColumns: Array<string>, rows: Array<object>): Promise<void> {
    const maxRowsPerQuery = 500;

    for (let i = 0; i < rows.length; i += maxRowsPerQuery) {
        const rowsSubset = rows.slice(i, i + maxRowsPerQuery);

        // TODO: Remove pg-format and find a better way to do this
        const query = format(
            `
                INSERT INTO ${tableName}
                    (${tableColumns.join(", ")})
                VALUES
                    %L
            `,
            rowsSubset
        );

        const success = await execute(query);
        console.log(success);
    }
}

function addOnlyOrderObjects(dataFromFile: Array<orderObject>): {[key: string]: orderObject} {
    const match = "gid://shopify/Order";
    const result= dataFromFile.reduce((accumulator: {[key: string]: orderObject} , currentObject) => {
        if (currentObject.id.includes(match)) {
            accumulator = {...accumulator, [currentObject.id]: [currentObject]};
        }
        return accumulator;
    }, {} as {[key: string]: orderObject});
    return result;
}

function addAllLineItems(accumulatedData: {[key: string]: orderObject}, dataFromFile: Array<lineItemObject>): {[key: string]: orderObject} {
    const match = "gid://shopify/LineItem";
    dataFromFile.forEach((currentObject) => {
        if (currentObject.id.includes(match)) {
            const orderId: string = currentObject["__parentId"];
            if (accumulatedData[orderId].lineItems === undefined) {
                accumulatedData[orderId].lineItems = [];
            }
            accumulatedData[orderId].lineItems?.push(currentObject);
        }
    });
    return accumulatedData;
}

export async function getRawData(filename: File) {
    const fileContents = await filename.text();
    // TODO: Read file by using readline
    const dataFromFile = fileContents.split(/\r?\n/);

    // Convert array of strings into array of objects
    const rawData: Array<object> = dataFromFile.reduce((result: Array<object>, curValue, index) => {
        if (index < dataFromFile.length - 1) {
            result.push(JSON.parse(curValue));
        }
        return result;
    }, []);
    return rawData;
}

export async function processFileUpload(filename: File) {
    const rowObjects: Array<any> = await getRawData(filename);

    let preprocessedData: {[key: string]: orderObject} = {};
    preprocessedData = addOnlyOrderObjects(rowObjects);
    preprocessedData = addAllLineItems(preprocessedData, rowObjects);
    console.log(JSON.stringify(preprocessedData));

    // insertIntoTable("shopify_api", ["data"], rowObjects);
}
