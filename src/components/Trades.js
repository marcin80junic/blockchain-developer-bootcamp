import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import { 
    filledOrdersSelector,
    filledOrdersLoadedSelector
} from '../store/selectors'    


class Trades extends Component {
    render() {
        return (
            <div className="vertical">
                <div className="card bg-dark text-white">
                    <div className="card-header">
                        Trades
                    </div>
                    <div className="card-body">
                        <table className="table table-dark table-sm small">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>DAPP</th>
                                    <th>DAPP/ETH</th>
                                </tr>
                            </thead>
                            {
                                this.props.filledOrdersLoaded ?
                                    showFilledOrders(this.props.filledOrders)
                                    : <Spinner type="table" />
                            }
                        </table>
                    </div>
                </div>
            </div>
        )
    }
}

const showFilledOrders = (filledOrders) => {
    return (
        <tbody>
            { filledOrders.map((order) => {
                return (
                    <tr className={ `text-${order.tokenPriceClass}`} key={ order.id } >
                        <td className="text-muted">{ order.formattedTimestamp }</td>
                        <td>{ order.tokenAmount }</td>
                        <td>{ order.tokenPrice }</td>
                    </tr>
                )
            }) }
        </tbody>
    )
}

const mapStateToProps = (state) => ({
    filledOrdersLoaded: filledOrdersLoadedSelector(state),
    filledOrders: filledOrdersSelector(state)
})

export default connect(mapStateToProps)(Trades)