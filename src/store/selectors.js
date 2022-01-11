import { get } from 'lodash'
import { createSelector } from 'reselect';
import moment from 'moment'
import { ETHER_ADDRESS, WHITE, GREEN, RED, ether, token } from '../helpers';


const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, ex => ex)

export const contractsLoadedSelector = createSelector(
    tokenLoaded,
    exchangeLoaded,
    (tl, el) => (tl && el)
)

const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
    filledOrders,
    (orders) => {
        // sort orders by date ascending for price comparison
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)
        orders = decorateFilledOrders(orders)
        // sort orders by date descending for display
        orders = orders.sort((a, b) => b.timestamp - a.timestamp)
        return orders
    }
)

const decorateFilledOrders = (orders) => {
    let previousOrder

    return(
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateFilledOrder(order, previousOrder)
            previousOrder = order
            return order    
        })
    )
}

const decorateFilledOrder = (order, previousOrder) => {
    return {
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, previousOrder)
    }
}

const tokenPriceClass = (tokenPrice, previousOrder) => {
    if(!previousOrder || previousOrder.tokenPrice === tokenPrice) {
        return WHITE
    }
    return (previousOrder.tokenPrice < tokenPrice)? GREEN: RED
}

const decorateOrder = (order) => {
    const precision = 100000
    let etherAmount, tokenAmount, tokenPrice

    if(order.tokenGive === ETHER_ADDRESS) {
        etherAmount = order.amountGive
        tokenAmount = order.amountGet
    } else {
        etherAmount = order.amountGet
        tokenAmount = order.amountGive
    }

    tokenPrice = etherAmount / tokenAmount
    tokenPrice = Math.round(tokenPrice * precision) / precision

    return {
        ...order,
        etherAmount: ether(etherAmount),
        tokenAmount: token(tokenAmount),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a D/M')
    }
}