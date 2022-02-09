import Web3 from'web3';
import Token from'../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { 
    web3Loaded,
    web3AccountLoaded,
    tokenLoaded,
    exchangeLoaded,
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded,
    orderCancelling,
    orderCancelled,
    orderFilling,
    orderFilled,
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    balancesLoading,
    balancesLoaded
} from "./actions"
import { ETHER_ADDRESS } from '../helpers';


export const loadWeb3 = (dispatch) => {
    const web3 = new Web3(window.ethereum)
    dispatch(web3Loaded(web3))
    return web3
}

export const loadAccount = async (web3, dispatch) => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    dispatch(web3AccountLoaded(account))
    return account
}

export const loadToken = (web3, networkId, dispatch) => {
    try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
        dispatch(tokenLoaded(token))
        return token
    } catch(error) {
        console.log('Contract NOT deployed to the current network.\nPlease select another network in Metamask')
        return null
    }
}

export const loadExchange = (web3, networkId, dispatch) => {
    try {
        const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
        dispatch(exchangeLoaded(exchange))
        return exchange
    } catch(error) {
        window.alert('Contract NOT deployed to the current network.\nPlease select another network in Metamask')
        return null
    }
}

export const loadAllOrders = async(dispatch, exchange) => {
    // fetch cancelled orders with the "Cancel" event stream
    const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest'})
    // format cancelled orders
    const cancelledOrders = cancelStream.map((event) => event.returnValues)
    // add cancelled orders to the redux store
    dispatch(cancelledOrdersLoaded(cancelledOrders))

    const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest'})
    const filledOrders = tradeStream.map((event) => event.returnValues)
    dispatch(filledOrdersLoaded(filledOrders))

    const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest'})
    const allOrders = orderStream.map((event) => event.returnValues)
    dispatch(allOrdersLoaded(allOrders))
}

export const subscribeToEvents = async (dispatch, web3, exchange, token) => {
    exchange.events.Cancel({}, (error, event) => {
        dispatch(orderCancelled(event.returnValues))
    })
    exchange.events.Trade({}, (error, event) => {
        dispatch(orderFilled(event.returnValues))
    })
    exchange.events.Deposit({}, (error, event) => {
        console.log('return value: ', event)
        loadBalances(dispatch, web3, exchange, token, event.returnValues.user)
    })
    exchange.events.Withdraw({}, (error, event) => {
        loadBalances(dispatch, web3, exchange, token, event.returnValues.user)
    })
}

export const cancelOrder = (dispatch, exchange, order, account) => {
    exchange
        .methods
        .cancelOrder(order.id)
        .send( { from: account })
        .on('transactionHash', (hash) => {
            dispatch(orderCancelling())
        })
        .on('error', (err) => {
            console.log('ERROR WHILE CANCELLING ORDER: ', err)
            alert('There was an error while canelling order')
        })
}

export const fillOrder = (dispatch, exchange, order, account) => {
    exchange
        .methods
        .fillOrder(order.id)
        .send( { from: account })
        .on('transactionHash', (hash) => {
            dispatch(orderFilling())
        })
        .on('error', (err) => {
            console.log('ERROR WHILE FILLING ORDER: ', err)
            alert('There was an error while filling order')
        })
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
    const etherBalance = await web3.eth.getBalance(account)
    dispatch(etherBalanceLoaded(etherBalance))

    const tokenBalance = await token.methods.balanceOf(account).call()
    dispatch(tokenBalanceLoaded(tokenBalance))

    const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
    dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

    const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
    dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

    dispatch(balancesLoaded())
}

export const depositEther = (dispatch, web3, exchange, amount, account) => {
    exchange
        .methods
        .depositEther()
        .send({ from: account, value: web3.utils.toWei(amount, 'ether') })
        .on('transactionHash', hash =>  dispatch(balancesLoading()))
        .on('error', (error) => {
            console.error(error)
            window.alert('There was an error while depositing ether')
        })
}

export const withdrawEther = (dispatch, web3, exchange, amount, account) => {
    exchange
        .methods
        .withdrawEther(web3.utils.toWei(amount, 'ether'))
        .send({ from: account })
        .on('transactionHash', hash =>  dispatch(balancesLoading()))
        .on('error', (error) => {
            console.error(error)
            window.alert('There was an error while withdrawing ether')
        })
}

export const depositToken = (dispatch, web3, exchange, token, amount, account) => {
    amount = web3.utils.toWei(amount, 'ether')
    console.log('AMOUNT: ', amount)
    token
        .methods
        .approve(exchange.options.address, amount)
        .send({ from: account })
        .on('transactionHash', (hash) => {
            exchange
                .methods
                .depositToken(token.options.address, amount)
                .send({ from: account })
                .on('transactionHash', (hash) => {
                    dispatch(balancesLoading())
                })
                .on('error', (error) => {
                    console.error(error)
                    window.alert('There was an error while depositing token')
                })
        })
}

export const withdrawToken = (dispatch, web3, exchange, token, amount, account) => {
    exchange
        .methods
        .withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether'))
        .send({ from: account })
        .on('transactionHash', (hash) => {
            dispatch(balancesLoading())
        })
        .on('error', (error) => {
            console.error(error)
            window.alert('There was an error while withdrawing token')
        })
}

