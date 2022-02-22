import React, { Component } from 'react';
import Navbar from './Navbar'
import Content from './Content'
import { connect } from 'react-redux';
import './app.css';
import { 
  loadWeb3, 
  loadAccount, 
  loadToken, 
  loadExchange, 
  subscribeToEvents 
} from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'
import detectEthereumProvider from '@metamask/detect-provider';


export class App extends Component {

  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    
    const provider = await detectEthereumProvider();
    if (provider) {
        provider.on('chainChanged', () => window.location.reload())
        provider.on('accountsChanged', () => window.location.reload())
    } else {
      console.log('Please install MetaMask!');
    }
  
    const web3 = loadWeb3(dispatch)
    const networkId = await web3.eth.net.getId()
    const account = await loadAccount(web3, dispatch)
    const token = await loadToken(web3, networkId, dispatch)
    const exchange = await loadExchange(web3, networkId, dispatch)

    console.log(`web3 network: ${await web3.eth.net.getNetworkType()}`)
    console.log(`web3 network ID: ${networkId}`)
    console.log('web3 all accounts', await web3.eth.getAccounts())
    console.log(`web3 selected account: ${account}`)

    if (!token) {
      alert('Token smart contract NOT detected on current network.\nPlease select another network with Metamask')
      return
    }
    if (!exchange) {
      alert('Exchange smart contract NOT detected on current network.\nPlease select another network with Metamask')
      return
    }
    await subscribeToEvents(dispatch, web3, exchange, token)
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
