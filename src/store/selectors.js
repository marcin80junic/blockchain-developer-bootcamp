import { get, reject, groupBy } from 'lodash'
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

const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

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

const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
const allOrders = state => get(state, 'exchange.allOrders.data', [])
const openOrders = state => {
    const all = allOrders(state)
    const filled = filledOrders(state)
    const cancelled = cancelledOrders(state)

    return reject(all, (order) => {
        const isOrderFilled = filled.some((o) => order.id === o.id)
        const isOrderCancelled = cancelled.some((o) => order.id === o.id)
        return isOrderFilled || isOrderCancelled
    })
}

const orderBookLoaded = 
    state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)
export const orderBookSelector = createSelector(
    openOrders,
    (orders) => {
        orders = decorateOrderBookOrders(orders)
        // group orders by orderType
        orders = groupBy(orders, 'orderType')
        // fetch buy and sell orders
        const buyOrders = get(orders, 'buy', [])
        const sellOrders = get(orders, 'sell', [])
        // sort 'buy' and 'sell' orders by token price
        orders = {
            ...orders,
            buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice),
            sellOrders: sellOrders.sort((a,b) => a.tokenPrice - b.tokenPrice)
        }
        return orders
    }
)

const decorateOrderBookOrders = (orders) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateOrderBookOrder(order)
            return order
        })
    )
}
const decorateOrderBookOrder = (order) => {
    const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy': 'sell'
    return {
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN: RED),
        orderFillClass: (orderType === 'buy' ? 'sell': 'buy')
    }
}

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


export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)
export const myFilledOrdersSelector = createSelector(
    account,
    filledOrders,
    (account, orders) => {
        orders = orders.filter((o) => o.user === account || o.userFill === account)
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)
        orders = decorateMyFilledOrders(orders, account)
        return orders
    }
)

const decorateMyFilledOrders = (orders, account) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateMyFilledOrder(order, account)
            return order
        })
    )
}
const decorateMyFilledOrder = (order, account) => {
    const myOrder = order.user === account
    let orderType

    if(myOrder) {
        orderType = order.tokenGive === ETHER_ADDRESS ? 'buy': 'sell'
    } else {
        orderType = order.tokenGive === ETHER_ADDRESS ? 'sell': 'buy'
    }

    return ({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN: RED),
        orderSign: (orderType === 'buy' ? '+': '-')
    })
}


export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)
export const myOpenOrdersSelector = createSelector(
    account,
    openOrders,
    (account, orders) => {
        orders = orders.filter((o) => o.user === account)
        orders = orders.sort((a, b) => b.timestamp - a.timestamp)
        orders = decorateMyOpenOrders(orders, account)
        return orders
    }
)

const decorateMyOpenOrders = (orders, account) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateMyOpenOrder(order, account)
            return order
        })
    )
}
const decorateMyOpenOrder = (order, account) => {
    const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy': 'sell'

    return ({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN: RED)
    })
}
