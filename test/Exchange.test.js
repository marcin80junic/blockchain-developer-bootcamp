import { tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'

const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')

require('chai').use(require('chai-as-promised')).should()

contract('Exchange', ([deployer, feeAccount, user1]) => {

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

    describe('depositing ether', async () => {
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

    describe('depositing tokens', () => {
        let result
        let amount
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

})