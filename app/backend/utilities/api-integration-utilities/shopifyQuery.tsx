export const shopifyQuery =`
query($updated_at: String, $numProducts: Int!, $cursor: String) {
    orders(first: $numProducts, query: $updated_at, after: $cursor) {
      edges {
        node {
            id
            name
            tags
            updatedAt
            cancelledAt
            createdAt
            netPaymentSet {
            presentmentMoney {
                amount
                currencyCode
            }
            shopMoney {
                amount
                currencyCode
            }
            }
            customer {
            id
            displayName
            email
            firstName
            lastName
            phone
            }
            customerJourneySummary {
            firstVisit {
                utmParameters {
                campaign
                content
                medium
                source
                term
                }
            }
            lastVisit {
                id
                utmParameters {
                campaign
                content
                medium
                source
                term
                }
            }
            }
            shippingAddress {
            id
            address1
            address2
            city
            country
            countryCodeV2
            province
            provinceCode
            zip
            }
            subtotalLineItemsQuantity
            lineItems(first: 25) {
            edges {
                node {
                id
                sku
                name
                product {
                    productType
                }
                variant {
                    id
                }
                variantTitle
                quantity
                originalTotalSet {
                    presentmentMoney {
                    amount
                    currencyCode
                    }
                    shopMoney {
                    amount
                    currencyCode
                    }
                }
                originalUnitPriceSet {
                    presentmentMoney {
                    amount
                    currencyCode
                    }
                    shopMoney {
                    amount
                    currencyCode
                    }
                }
                currentQuantity
                discountedTotalSet {
                    presentmentMoney {
                    amount
                    currencyCode
                    }
                    shopMoney {
                    amount
                    currencyCode
                    }
                }
                totalDiscountSet {
                    presentmentMoney {
                    amount
                    currencyCode
                    }
                    shopMoney {
                    amount
                    currencyCode
                    }
                }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
            }
            refunds(first: 10) {
                createdAt
                staffMember {
                    active
                    email
                    exists
                    email
                    firstName
                    id
                    isShopOwner
                    lastName
                    phone
                    locale
                }
                id
                totalRefundedSet {
                    presentmentMoney {
                        amount
                        currencyCode
                    }
                    shopMoney {
                        amount
                        currencyCode
                    }
                }
                updatedAt
            }
            fulfillments(first: 25) {
                createdAt
                deliveredAt
                displayStatus
                estimatedDeliveryAt
                id
                inTransitAt
                location {
                    activatable
                    address {
                        address1
                        address2
                        city
                        country
                        countryCode
                        formatted
                        latitude
                        longitude
                        phone
                        province
                        provinceCode
                        zip
                    }
                }
                name
                originAddress {
                    address1
                    address2
                    city
                    countryCode
                    provinceCode
                    zip
                }
                requiresShipping
                service {
                    callbackUrl
                    handle
                    id
                    inventoryManagement
                    location {
                      activatable
                      address {
                          address1
                          address2
                          city
                          country
                          countryCode
                          formatted
                          latitude
                          longitude
                          phone
                          province
                          provinceCode
                          zip
                      }
                  }
                  permitsSkuSharing
                  productBased
                  serviceName
                  shippingMethods {
                      code
                      label
                  }
                  type
                }
                status
                totalQuantity
                updatedAt
            }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
}`;