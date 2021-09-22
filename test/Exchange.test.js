import { tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'

const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')

require('chai').use(require('chai-as-promised')).should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {

    let exchange
    let token
    const feePercent = 10;

    beforeEach(async () => {
        token = await Token.new()
        token.transfer(user1, tokens(100), {from: deployer})
        exchange = await Exchange.new(feeAccount, feePercent)
    })

    describe('deployment', () => {
        it('tracks the fee account', async () => {
            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)
        })
        it('tracks the fee percentage', async () => {
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })
    })

    describe('fallback', () => {
        it('reverts when ether is sent', async () => {
            await exchange
                .sendTransaction({value: 1, from: user1})
                .should.be.rejectedWith(EVM_REVERT)
        })
    })

    describe('depositing ether', () => {
        let result, amount
        beforeEach(async () => {
            amount = tokens(1)
            result = await exchange.depositEther({from: user1, value: amount})
        })
        it('tracks the ether deposit', async () =>{
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })
        it('emits a Deposit event', () => {
            const log = result.logs[0]
            log.event.should.eq('Deposit')
            const event = log.args
            event.token.should.equal(ETHER_ADDRESS, 'token address is correct')
            event.user.should.equal(user1, 'user address is correct')
            event.amount.toString().should.equal(amount.toString(), 'amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
    })

    describe('withdrawing ether', () => {
        let result, amount
        beforeEach(async () => {
            amount = tokens(1)
            await exchange.depositEther({from: user1, value: amount})
        })
        describe('success', () => {
            beforeEach(async () => {
                result = await exchange.withdrawEther(amount, {from: user1})
            })
            it('withdraws ether funds', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal('0')
            })
            it('emits a Withdraw event', () => {
                const log = result.logs[0]
                log.event.should.eq('Withdraw')
                const event = log.args
                event.token.should.equal(ETHER_ADDRESS, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0', 'balance is correct')
            })
        })
        describe('failure', () => {
            it('rejects withdrawals for insufficient balances', async () => {
                await exchange
                    .withdrawEther(tokens(100), {from: user1})
                    .should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('depositing tokens', () => {
        let result, amount
        describe('success', () => {
            beforeEach(async () => {
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                result = await exchange.depositToken(token.address, amount, { from: user1 })
            })
            it('tracks the token deposits', async () => {
                let balance
                // check exchange token balance
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                // check tokens on exchange
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })
            it('emits a Deposit event', () => {
                const log = result.logs[0]
                log.event.should.eq('Deposit')
                const event = log.args
                event.token.should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')
            })
        })
        describe('failure', () => {
            it('rejects ether deposits', async () => {
                await exchange
                    .depositToken(ETHER_ADDRESS, tokens(10), {from: user1})
                    .should.be.rejectedWith(EVM_REVERT)
            })
            it('fails when no tokens are approved', async () => {
                await exchange
                    .depositToken(token.address, tokens(10), {from: user1})
                    .should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('withdrawing tokens', () => {
        let result, amount
        describe('success', () => {
            beforeEach(async () => {
                amount = tokens(10)
                await token.approve(exchange.address, amount, {from: user1})
                await exchange.depositToken(token.address, amount, {from: user1})
                result = await exchange.withdrawToken(token.address, amount, {from: user1})
            })
            it('withdraws token funds', async () => {
                const balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal('0')
            })
            it('emits a Withdraw event', () => {
                const log = result.logs[0]
                log.event.should.eq('Withdraw')
                const event = log.args
                event.token.should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0', 'balance is correct')
            })
        })
        describe('failure', () => {
            it('rejects Ether withdrawals', async () => {
                await exchange
                    .withdrawToken(ETHER_ADDRESS, amount, {from: user1})
                    .should.be.rejectedWith(EVM_REVERT)
            })
            it('rejects withdrawals for insufficient balances', async () => {
                await exchange
                    .withdrawToken(token.address, tokens(1000), {from: user1})
                    .should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('checking balances', () => {
        let amount;
        beforeEach(async () => {
            amount = tokens(1)
            await exchange.depositEther({from: user1, value: amount})
        })
        it('returns user balance', async () => {
            const balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })
    })

    describe('making orders', () => {
        let result, amount
        beforeEach(async () => {
            amount = tokens(1)
            result = await exchange
                .makeOrder(token.address, amount, ETHER_ADDRESS, amount, {from: user1})
        })
        it('tracks the newly created order', async () => {
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal('1')
            const order = await exchange.orders('1')
            order.id.toString().should.equal('1', 'id is correct')
            order.user.should.equal(user1, 'user address is correct')
            order.tokenGet.should.equal(token.address, 'token address is correct')
            order.amountGet.toString().should.equal(amount.toString(), 'amountGet is correct')
            order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            order.amountGive.toString().should.equal(amount.toString(), 'amountGive is correct')
            order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
        it('emits an Order Event', async () => {
            const log = result.logs[0]
            log.event.should.eq('Order')
            const event = log.args
            event.id.toString().should.equal('1', 'id is correct')
            event.user.should.equal(user1, 'user address is correct')
            event.tokenGet.should.equal(token.address, 'token address is correct')
            event.amountGet.toString().should.equal(amount.toString(), 'amountGet is correct')
            event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            event.amountGive.toString().should.equal(amount.toString(), 'amountGive is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
    })

    describe('order actions', () => {
        let amount = tokens(1)
        beforeEach(async () => {
            await exchange.depositEther({from: user1, value: amount})
            await exchange.makeOrder(token.address, amount, ETHER_ADDRESS, amount, {from: user1})
        })
        describe('cancelling orders', () => {
            let result
            describe('success', () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder('1', { from: user1 })
                })
                it('updates cancelled orders', async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })
                it('emits a Cancel Event', async () => {
                    const log = result.logs[0]
                    log.event.should.eq('Cancel')
                    const event = log.args
                    event.id.toString().should.equal('1', 'id is correct')
                    event.user.should.equal(user1, 'user address is correct')
                    event.tokenGet.should.equal(token.address, 'token address is correct')
                    event.amountGet.toString().should.equal(amount.toString(), 'amountGet is correct')
                    event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
                    event.amountGive.toString().should.equal(amount.toString(), 'amountGive is correct')
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
                })
            })
            describe('failure', () => {
                it('rejects invalid orders', async () => {
                    const invalidOrderId = 9999
                    await exchange
                        .cancelOrder(invalidOrderId, {from: user1})
                        .should.be.rejectedWith(EVM_REVERT)
                })
                it('rejects unauthorized cancellations', async () => {
                    await exchange
                        .cancelOrder('1', {from: user2})
                        .should.be.rejectedWith(EVM_REVERT)
                })
            })
        })
    })

})