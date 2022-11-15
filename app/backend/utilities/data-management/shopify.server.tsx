import {ColumnInfo} from "~/backend/data-management";
import {delay} from "~/utilities/utilities";
import {shopifyQuery} from "../api-integration-utilities/shopifyQuery";

const shopifyApiBaseUrl = "https://livpuresleep.myshopify.com/admin/api/2022-10/graphql.json";

async function getShopifyData(minDate: string, maxDate: string = "2030-10-2", numProducts: number, endCursor: string | null): Promise<Array<object>> {
    const response = await fetch(shopifyApiBaseUrl, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
            "Content-Type": "application/json",
            "X-GraphQL-Cost-Include-Fields": "true",
        },
        body: JSON.stringify({
            query: shopifyQuery,
            variables: {
                updated_at: `updated_at:>${minDate} updated_at:<${maxDate}`,
                numProducts: numProducts,
                cursor: endCursor ?? null,
            },
        }),
    });
    const ordersInformation = await response.json();
    return ordersInformation;
}

function findDateRange(orders: any): object {
    const dates = orders.map((order) => order.node.updatedAt);
    const minDate = dates.reduce((minDate, date) => (minDate == null || date < minDate ? date : minDate), null);
    const maxDate = dates.reduce((maxDate, date) => (maxDate == null || date > maxDate ? date : maxDate), null);

    return {
        count: dates.length,
        minDate: minDate,
        maxDate: maxDate,
    };
}

export async function ingestDataFromShopifyApi(minDate: string, maxDate: string = "2030-10-2"): Promise<Array<object>> {
    try {
        const orders: Array<object> = [];
        let orderInfo = await getShopifyData(minDate, maxDate, 1, null);
        if (orderInfo.data.orders.edges[0].node.lineItems.pageInfo.hasNextPage) {
            throw "Lineitems exceeded!";
        }
        orders.push(...orderInfo.data.orders.edges!);
        let pageNo = 1;
        while (orderInfo && orderInfo.data.orders.pageInfo.hasNextPage) {
            if (pageNo > 10) {
                break;
            }
            orderInfo = await getShopifyData(minDate, maxDate, 1, orderInfo.data.orders.pageInfo.endCursor);
            delay(1000);
            if (orderInfo.data.orders.edges[0].node.lineItems.pageInfo.hasNextPage) {
                throw "Lineitems exceeded!";
            }
            orders.push(...orderInfo.data.orders.edges!);
            pageNo++;
        }
        console.log(findDateRange(orders));

        return orders;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export const shopifyTableColumnInfos: Array<ColumnInfo> = [
    {tableColumn: "hour", csvColumn: "hour"},
    {tableColumn: "cancelled", csvColumn: "cancelled"},
    {tableColumn: "financial_status", csvColumn: "financial_status"},
    {tableColumn: "order_id", csvColumn: "order_id"},
    {tableColumn: "order_name", csvColumn: "order_name"},
    {tableColumn: "adjustment", csvColumn: "adjustment"},
    {tableColumn: "fulfillment_status", csvColumn: "fulfillment_status"},
    {tableColumn: "purchase_option", csvColumn: "purchase_option"},
    {tableColumn: "sale_kind", csvColumn: "sale_kind"},
    {tableColumn: "sale_line_type", csvColumn: "sale_line_type"},
    {tableColumn: "cost_tracked", csvColumn: "cost_tracked"},
    {tableColumn: "billing_company", csvColumn: "billing_company"},
    {tableColumn: "billing_city", csvColumn: "billing_city"},
    {tableColumn: "billing_region", csvColumn: "billing_region"},
    {tableColumn: "billing_country", csvColumn: "billing_country"},
    {tableColumn: "billing_postal_code", csvColumn: "billing_postal_code"},
    {tableColumn: "customer_email", csvColumn: "customer_email"},
    {tableColumn: "customer_id", csvColumn: "customer_id"},
    {tableColumn: "customer_name", csvColumn: "customer_name"},
    {tableColumn: "customer_type", csvColumn: "customer_type"},
    {tableColumn: "marketing_event_target", csvColumn: "marketing_event_target"},
    {tableColumn: "marketing_event_type", csvColumn: "marketing_event_type"},
    {tableColumn: "utm_campaign_content", csvColumn: "utm_campaign_content"},
    {tableColumn: "utm_campaign_medium", csvColumn: "utm_campaign_medium"},
    {tableColumn: "utm_campaign_name", csvColumn: "utm_campaign_name"},
    {tableColumn: "utm_campaign_source", csvColumn: "utm_campaign_source"},
    {tableColumn: "utm_campaign_term", csvColumn: "utm_campaign_term"},
    {tableColumn: "pos_location_name", csvColumn: "pos_location_name"},
    {tableColumn: "product_id", csvColumn: "product_id"},
    {tableColumn: "product_price", csvColumn: "product_price"},
    {tableColumn: "product_title", csvColumn: "product_title"},
    {tableColumn: "product_type", csvColumn: "product_type"},
    {tableColumn: "product_vendor", csvColumn: "product_vendor"},
    {tableColumn: "variant_id", csvColumn: "variant_id"},
    {tableColumn: "variant_sku", csvColumn: "variant_sku"},
    {tableColumn: "variant_title", csvColumn: "variant_title"},
    {tableColumn: "shipping_city", csvColumn: "shipping_city"},
    {tableColumn: "shipping_region", csvColumn: "shipping_region"},
    {tableColumn: "shipping_country", csvColumn: "shipping_country"},
    {tableColumn: "shipping_postal_code", csvColumn: "shipping_postal_code"},
    {tableColumn: "api_client_title", csvColumn: "api_client_title"},
    {tableColumn: "staff_id", csvColumn: "staff_id"},
    {tableColumn: "staff_name", csvColumn: "staff_name"},
    {tableColumn: "id_of_staff_who_helped_with_sale", csvColumn: "id_of_staff_who_helped_with_sale"},
    {tableColumn: "name_of_staff_who_helped_with_sale", csvColumn: "name_of_staff_who_helped_with_sale"},
    {tableColumn: "referrer_host", csvColumn: "referrer_host"},
    {tableColumn: "referrer_name", csvColumn: "referrer_name"},
    {tableColumn: "referrer_path", csvColumn: "referrer_path"},
    {tableColumn: "referrer_source", csvColumn: "referrer_source"},
    {tableColumn: "referrer_url", csvColumn: "referrer_url"},
    {tableColumn: "orders", csvColumn: "orders"},
    {tableColumn: "gross_sales", csvColumn: "gross_sales"},
    {tableColumn: "discounts", csvColumn: "discounts"},
    {tableColumn: "returns", csvColumn: "returns"},
    {tableColumn: "net_sales", csvColumn: "net_sales"},
    {tableColumn: "shipping", csvColumn: "shipping"},
    {tableColumn: "duties", csvColumn: "duties"},
    {tableColumn: "additional_fees", csvColumn: "additional_fees"},
    {tableColumn: "taxes", csvColumn: "taxes"},
    {tableColumn: "total_sales", csvColumn: "total_sales"},
    {tableColumn: "average_order_value", csvColumn: "average_order_value"},
    {tableColumn: "total_tips", csvColumn: "total_tips"},
    {tableColumn: "total_cost", csvColumn: "total_cost"},
    {tableColumn: "gross_profit", csvColumn: "gross_profit"},
    {tableColumn: "gross_margin", csvColumn: "gross_margin"},
    {tableColumn: "units_per_transaction", csvColumn: "units_per_transaction"},
    {tableColumn: "customers", csvColumn: "customers"},
    {tableColumn: "gift_card_discounts", csvColumn: "gift_card_discounts"},
    {tableColumn: "gift_card_gross_sales", csvColumn: "gift_card_gross_sales"},
    {tableColumn: "gift_cards_issued", csvColumn: "gift_cards_issued"},
    {tableColumn: "pending_sales", csvColumn: "pending_sales"},
    {tableColumn: "net_quantity", csvColumn: "net_quantity"},
    {tableColumn: "ordered_item_quantity", csvColumn: "ordered_item_quantity"},
    {tableColumn: "average_units_ordered", csvColumn: "average_units_ordered"},
    {tableColumn: "returned_item_quantity", csvColumn: "returned_item_quantity"},
    {tableColumn: "percent_of_sales_with_staff_help", csvColumn: "percent_of_sales_with_staff_help"},
];
