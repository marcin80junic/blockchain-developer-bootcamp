export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
export const DECIMALS = 10**18
export const WHITE = 'light'
export const GREEN = 'success'
export const RED = 'danger'

export const ether = (wei) => {
    if(wei) {
        return wei / DECIMALS
    }
}
export const tokens = ether

export const formatBalance = (balance) => {
    const precision = 10000   // 4 decimal places
    balance = ether(balance)
    balance = Math.round(balance * precision) / precision
    //balance = parseFloat(balance)
    return balance
}