import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Tab, Tabs } from 'react-bootstrap'
import {
    myFilledOrdersLoadedSelector,
    myFilledOrdersSelector,
    myOpenOrdersLoadedSelector,
    myOpenOrdersSelector
} from '../store/selectors'
import Spinner from './Spinner'


const showMyFilledOrders = (myFilledOrders) => {
    return (
        <tbody>
            { myFilledOrders.map((order) => {
                const className = `text-${order.orderTypeClass}`
                return (
                    <tr key={order.id}>
                        <td className="text-muted">{order.formattedTimestamp}</td>
                        <td className={className}>{order.orderSign}{order.tokenAmount}</td>
                        <td className={className}>{order.tokenPrice}</td>
                    </tr>
                )
            }) }
        </tbody>
    )
}

const showMyOpenOrders = (myOpenOrders) => {
    return (
        <tbody>
            { myOpenOrders.map((order) => {
                const className = `text-${order.orderTypeClass}`
                return (
                    <tr key={order.id}>
                        <td className={className}>{order.tokenAmount}</td>
                        <td className={className}>{order.tokenPrice}</td>
                        <td className="text-muted">X</td>
                    </tr>
                )
            }) }
        </tbody>
    )
}

export class MyTransactions extends Component {
    render() {
        return (
            <div className="card bg-dark text-white">
                <div className="card-header">
                    My Transactions
                </div>
                <div className="card-body">
                    <Tabs defaultActiveKey="trades" className="bg-dark text-white">
                        <Tab eventKey="trades" title="Trades" className="bg-dark">
                            <table className="table table-dark table-sm small">
                                <thead>
                                    <tr>
                                        <th>DAPP</th>
                                        <th>DAPP</th>
                                        <th>DAPP/ETH</th>
                                    </tr>
                                </thead>
                                { this.props.showMyFilledOrders ? 
                                    showMyFilledOrders(this.props.myFilledOrders)
                                    : <Spinner type="table" /> }
                            </table>
                        </Tab>
                        <Tab eventKey="orders" title="Orders">
                            <table className="table table-dark table-sm small">
                                <thead>
                                    <tr>
                                        <th>DAPP</th>
                                        <th>DAPP/ETH</th>
                                        <th>Cancel</th>
                                    </tr>
                                </thead>
                                { this.props.showMyOpenOrders ?
                                    showMyOpenOrders(this.props.myOpenOrders)
                                    : <Spinner type="table" /> }
                            </table>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        myFilledOrders: myFilledOrdersSelector(state),
        showMyFilledOrders: myFilledOrdersLoadedSelector(state),
        myOpenOrders: myOpenOrdersSelector(state),
        showMyOpenOrders: myOpenOrdersLoadedSelector(state)
    } 
}

export default connect(mapStateToProps)(MyTransactions)
