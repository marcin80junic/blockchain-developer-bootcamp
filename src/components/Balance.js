import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs } from 'react-bootstrap';
import Spinner from './Spinner'
import { 
    etherDepositAmountChanged,
    etherWithdrawAmountChanged,
    tokenDepositAmountChanged,
    tokenWithdrawAmountChanged
} from '../store/actions'
import { 
    loadBalances, 
    depositEther,
    withdrawEther,
    depositToken,
    withdrawToken
} from '../store/interactions'
import {
    web3Selector,
    exchangeSelector,
    tokenSelector,
    accountSelector,
    etherBalanceSelector,
    tokenBalanceSelector,
    exchangeEtherBalanceSelector,
    exchangeTokenBalanceSelector,
    balancesLoadingSelector,
    etherDepositAmountSelector,
    etherWithdrawAmountSelector,
    tokenDepositAmountSelector,
    tokenWithdrawAmountSelector
} from '../store/selectors'


const showForm = (props) => {
    const {
        dispatch,
        web3,
        exchange,
        token,
        account,
        etherBalance, 
        exchangeEtherBalance, 
        tokenBalance, 
        exchangeTokenBalance, 
        etherDepositAmount,
        etherWithdrawAmount,
        tokenDepositAmount,
        tokenWithdrawAmount
    } = props

    const tableBody = {
        row1: {
            1: 'ETH',
            2: etherBalance,
            3: exchangeEtherBalance
        },
        row2: {
            1: 'DAPP',
            2: tokenBalance,
            3: exchangeTokenBalance
        }
    }
    return(
        <div>
            <table className="table table-dark table-sm small">
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>Wallet</th>
                        <th>Exchange</th>
                    </tr>
                </thead>
                { createTableBody(tableBody) }
            </table>

            <Tabs defaultActiveKey="deposit" className="bg-dark text-white">

                <Tab eventKey="deposit" title="Deposit" className="bg-dark">
                    <form className="row" onSubmit={(event) => {
                        event.preventDefault()
                        depositEther(dispatch, web3, exchange, etherDepositAmount, account)
                    }}>
                        <div className="col-12 col-sm pr-sm-2">
                            <input
                                type="text"
                                placeholder="ETH Amount"
                                onChange={(e) => dispatch(etherDepositAmountChanged(e.target.value))}
                                className="form-control form-control-sm bg-dark text-white"
                                required
                            />
                        </div>
                        <div className="col-12 col-sm-auto pl-sm-0">
                            <button type="submit" className="btn btn-primary btn-block btn-sm text-sm">
                                Deposit ETH
                            </button>
                        </div>
                    </form>

                    <form className="row" onSubmit={(event) => {
                        event.preventDefault()
                        depositToken(dispatch, web3, exchange, token, tokenDepositAmount, account)
                    }}>
                        <div className="col-12 col-sm pr-sm-2">
                            <input
                                type="text"
                                placeholder="DAPP Amount"
                                onChange={(e) => dispatch(tokenDepositAmountChanged(e.target.value))}
                                className="form-control form-control-sm bg-dark text-white"
                                required
                            />
                        </div>
                        <div className="col-12 col-sm-auto pl-sm-0">
                            <button type="submit" className="btn btn-primary btn-block btn-sm">
                                Deposit DAPP
                            </button>
                        </div>
                    </form>
                </Tab>

                <Tab eventKey="withdraw" title="Withdraw" className="bg-dark">
                    <form className="row" onSubmit={(event) => {
                        event.preventDefault()
                        withdrawEther(dispatch, web3, exchange, etherWithdrawAmount, account)
                    }}>
                        <div className="col-12 col-sm pr-sm-2">
                            <input
                                type="text"
                                placeholder="ETH Amount"
                                onChange={(e) => dispatch(etherWithdrawAmountChanged(e.target.value))}
                                className="form-control form-control-sm bg-dark text-white"
                                required
                            />
                        </div>
                        <div className="col-12 col-sm-auto pl-sm-0">
                            <button type="submit" className="btn btn-primary btn-block btn-sm">
                                Withdraw ETH
                            </button>
                        </div>
                    </form>

                    <form className="row" onSubmit={(event) => {
                        event.preventDefault()
                        withdrawToken(dispatch, web3, exchange, token, tokenWithdrawAmount, account)
                    }}>
                        <div className="col-12 col-sm pr-sm-2">
                            <input
                                type="text"
                                placeholder="DAPP Amount"
                                onChange={(e) => dispatch(tokenWithdrawAmountChanged(e.target.value))}
                                className="form-control form-control-sm bg-dark text-white"
                                required
                            />
                        </div>
                        <div className="col-12 col-sm-auto pl-sm-0">
                            <button type="submit" className="btn btn-primary btn-block btn-sm">
                                Withdraw DAPP
                            </button>
                        </div>
                    </form>
                </Tab>

            </Tabs>
        </div>
    )
}

const createTableBody = (tbody) => {
    return (
        <tbody>
            {Object.keys(tbody).map(
                (key) => {
                    return (
                        <tr key={key}>
                            {Object.keys(tbody[key]).map(
                                k => <td key={k}> {tbody[key][k]} </td>
                            )}
                        </tr>
                    )
                }
            )}
        </tbody>
    )
}


export class Balance extends Component {

    UNSAFE_componentWillMount() {
        this.loadBlockchainData()
    }
    async loadBlockchainData() {
        const { dispatch, web3, exchange, token, account } = this.props
        await loadBalances(dispatch, web3, exchange, token, account)
    }

    render() {
        return (
            <div className="card bg-dark text-white">
                <div className="card-header">
                    Balance
                </div>
                <div className="card-body">
                    { this.props.showForm? showForm(this.props): <Spinner />}
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    const balancesLoading = balancesLoadingSelector(state)
    return {
        account: accountSelector(state),
        exchange: exchangeSelector(state),
        token: tokenSelector(state),
        web3: web3Selector(state),
        etherBalance: etherBalanceSelector(state),
        tokenBalance: tokenBalanceSelector(state),
        exchangeEtherBalance: exchangeEtherBalanceSelector(state),
        exchangeTokenBalance: exchangeTokenBalanceSelector(state),
        balancesLoading,
        showForm: !balancesLoading,
        etherDepositAmount: etherDepositAmountSelector(state),
        etherWithdrawAmount: etherWithdrawAmountSelector(state),
        tokenDepositAmount: tokenDepositAmountSelector(state),
        tokenWithdrawAmount: tokenWithdrawAmountSelector(state)
    }
};


export default connect(mapStateToProps)(Balance);
