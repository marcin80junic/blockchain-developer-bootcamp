import moment from 'moment'
import { groupBy, maxBy, minBy } from 'lodash'
import { ETHER_ADDRESS, WHITE, GREEN, RED, ether, tokens } from '../helpers';


export const decorateFilledOrders = (orders) => {
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


export const decorateOrderBookOrders = (orders) => {
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
        orderFillAction: (orderType === 'buy' ? 'sell': 'buy')
    }
}


export const decorateMyFilledOrders = (orders, account) => {
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


export const decorateMyOpenOrders = (orders, account) => {
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


export const buildGraphData = (orders) => {
    // group the orders by hour for the graph
    orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())
    // get each hour where orders exist
    const hours = Object.keys(orders)
    // build the graph series
    const graphData = hours.map((hour) => {
        // fetch all the orders from current hour
        const group = orders[hour]
        // calculate price values - open, high, low, close
        const open = group[0].tokenPrice
        const high = maxBy(group, 'tokenPrice').tokenPrice
        const low = minBy(group, 'tokenPrice').tokenPrice
        const close = group[group.length - 1].tokenPrice
        return ({
            x: new Date(hour),
            y: [open, high, low, close]
        })
    })
    return graphData
}


export const decorateOrder = (order) => {
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
        tokenAmount: tokens(tokenAmount),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a D/M')
    }
}