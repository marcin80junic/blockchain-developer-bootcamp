import React, { Component } from 'react';
import Navbar from './Navbar'
import Content from './content'
import { connect } from 'react-redux';
import './app.css';
import { loadWeb3, loadAccount, loadToken, loadExchange } from '../store/interactions'
import {contractsLoadedSelector } from '../store/selectors'


class App extends Component {

  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = loadWeb3(dispatch)
    const networkId = await web3.eth.net.getId()
    const accounts = await web3.eth.getAccounts();
    const account = await loadAccount(web3, dispatch)
    const token = await loadToken(web3, networkId, dispatch)
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!token) {
      alert('Token smart contract NOT detected on current network.\nPlease select another network with Metamask')
      return
    }
    if(!exchange) {
      alert('Exchange smart contract NOT detected on current network.\nPlease select another network with Metamask')
      return
    }
    console.log('token: ', token)
    console.log(`network: ${await web3.eth.net.getNetworkType()}`)
    console.log(`network ID: ${networkId}`)
    console.log('all accounts', accounts)
    console.log(`account: ${account}`)
  }
  
  render() {
    return (
      <div>
        <Navbar />
        { this.props.contractsLoaded ?
            <Content />
            : <div className="content"></div>
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App)
