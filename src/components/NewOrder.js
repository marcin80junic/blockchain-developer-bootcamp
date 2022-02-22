import React, { Component } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import { 
    buyOrderAmountChanged, 
    buyOrderPriceChanged,
    sellOrderAmountChanged,
    sellOrderPriceChanged
} from '../store/actions'
import { 
    makeBuyOrder,
    makeSellOrder
} from '../store/interactions'
import { 
    accountSelector, 
    buyOrderSelector, 
    exchangeSelector, 
    sellOrderSelector, 
    tokenSelector, 
    web3Selector 
} from '../store/selectors'


const showForm = (props) => {
    const {
        dispatch,
        web3,
        exchange,
        token,
        buyOrder,
        sellOrder,
        account,
        showBuyTotal,
        showSellTotal
    } = props

    return (
        <Tabs defaultActiveKey="buy" className="bg-dark text-white">

            <Tab eventKey="buy" title="Buy" className="bg-dark">

                <form onSubmit={(event) => {
                    event.preventDefault()
                    makeBuyOrder(dispatch, web3, exchange, token, buyOrder, account)
                }}>
                    <div className="form-group small">
                        <label>Buy Amount DAPP</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control form-control-sm bg-dark text-white"
                                placeholder="Buy Amount"
                                onChange={(e) => dispatch(buyOrderAmountChanged(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group small">
                        <label>Buy Price</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control form-control-sm bg-dark text-white"
                                placeholder="Buy Price"
                                onChange={(e) => dispatch(buyOrderPriceChanged(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm btn-block">Buy Order</button>
                    { 
                        showBuyTotal ?
                            <small>
                                Total: {parseFloat((buyOrder.amount * buyOrder.price).toFixed(4))} ETH
                            </small>
                            : null 
                    }
                </form>

            </Tab>

            <Tab eventKey="sell" title="Sell" className="bg-dark">

                <form onSubmit={(event) => {
                    event.preventDefault()
                    makeSellOrder(dispatch, web3, exchange, token, sellOrder, account)
                }}>
                    <div className="form-group small">
                        <label>Sell Amount DAPP</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control form-control-sm bg-dark text-white"
                                placeholder="Sell Amount"
                                onChange={(e) => dispatch(sellOrderAmountChanged(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group small">
                        <label>Sell Price</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control form-control-sm bg-dark text-white"
                                placeholder="Sell Price"
                                onChange={(e) => dispatch(sellOrderPriceChanged(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm btn-block">Sell Order</button>
                    { 
                        showSellTotal ?
                            <small>
                                Total: {parseFloat((sellOrder.amount * sellOrder.price).toFixed(4))} ETH
                            </small>
                            : null 
                    }
                </form>

            </Tab>

        </Tabs>
    )
}


export class NewOrder extends Component {
    render() {
        return (
            <div className="card bg-dark text-white">
                <div className="card-header">
                    New Order
                </div>
                <div className="card-body">
                   { this.props.showForm? showForm(this.props): <Spinner /> }
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    const buyOrder = buyOrderSelector(state)
    const sellOrder = sellOrderSelector(state)

    return {
        web3: web3Selector(state),
        token: tokenSelector(state),
        exchange: exchangeSelector(state),
        account: accountSelector(state),
        buyOrder,
        sellOrder,
        showForm: !buyOrder.making && !sellOrder.making,
        showBuyTotal: buyOrder.amount && buyOrder.price,
        showSellTotal: sellOrder.amount && sellOrder.price
    }
}


export default connect(mapStateToProps)(NewOrder)