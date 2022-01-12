const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
const tokens = (n) => {
    return new web3.utils.BN(web3.utils.toWei(n.toString(), 'ether'))
}
const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports = async function(callback) {

    try {
        console.log('script running...');

        // fetch all accounts, deployed token and exchange
        const accounts = await web3.eth.getAccounts();
        const token = await Token.deployed();
        console.log('Token fetched', token.address);
        const exchange = await Exchange.deployed();
        console.log('Exchange fetched', exchange.address);

        // give tokens to account[1]
        const sender = accounts[0];
        const receiver = accounts[1];
        let amount = web3.utils.toWei('10000', 'ether');
        await token.transfer(receiver, amount, {from: sender});
        console.log(`transferred ${amount} tokens from ${sender} to ${receiver}`);

        // create users, user1 deposits Ether, user2 approves and deposits token
        const user1 = accounts[0];
        const user2 = accounts[1];
        amount = 1;
        await exchange.depositEther({from: user1, value: tokens(amount)});
        console.log(`deposited ${amount} Ether from ${user1}`);
        amount = 10000;
        await token.approve(exchange.address, tokens(amount), {from: user2});
        console.log(`approved ${amount} tokens from ${user2}`);
        await exchange.depositToken(token.address, tokens(amount), {from: user2});
        console.log(`deposited ${amount} tokens from ${user2}`);

        // seed a cancelled order
        let result, orderId;
        result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, tokens(0.1), { from: user1 })
        console.log(`Made order from ${user1}`)
        orderId = result.logs[0].args.id
        await exchange.cancelOrder(orderId, { from: user1 })
        console.log(`Cancelled order from ${user1}`)

        // seed filled orders
        result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, tokens(0.1), { from: user1 })
        console.log(`Made order from ${user1}`)
        orderId = result.logs[0].args.id
        await exchange.fillOrder(orderId, { from: user2 })
        console.log(`Filled order from ${user1}`)
        await wait(1);
        result = await exchange.makeOrder(token.address, tokens(50), ETHER_ADDRESS, tokens(0.01), {from: user1});
        console.log(`make order from ${user1}`);
        orderId = result.logs[0].args.id;
        await exchange.fillOrder(orderId, {from: user2});
        console.log(`filled order from${user1}`);
        await wait(1);
        result = await exchange.makeOrder(token.address, tokens(200), ETHER_ADDRESS, tokens(0.15), {from: user1});
        console.log(`make order from ${user1}`);
        orderId = result.logs[0].args.id;
        await exchange.fillOrder(orderId, {from: user2});
        console.log(`filled order from${user1}`);

        // seed open orders, user1 and user2 make 10 orders each
        for(let i = 1; i <= 10; i++) {
            result = await exchange.makeOrder(token.address, tokens(10*i), ETHER_ADDRESS, tokens(0.01), {from: user1});
            console.log(`make order from ${user1}`);
            await wait(1);
        }
        for(let i = 1; i <= 10; i++) {
            result = await exchange.makeOrder(ETHER_ADDRESS, tokens(0.01), token.address, tokens(10*i), {from: user2});
            console.log(`make order from ${user2}`);
            await wait(1);
        }

    } catch(error) {
        console.error(error);
    }

    callback();
}