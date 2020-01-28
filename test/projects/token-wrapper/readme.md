# Token Wrapper

Token Wrapper is an Aragon app offering a checkpointed ERC20 token interface that is usable in Aragon Voting applications. Its purpose is to bridge external, "vanilla" ERC20 tokens to a checkpointed token.

Token holders of the outside token have the ability to wrap and unwrap their tokens to gain or decrease balance in this wrapped token.

## 🚨 Not yet audited, use at your own risk

The `TokenWrapper` contract has not yet been professionally audited. It is relatively simple, but use with this asterisk in mind.

## Caveats

In efforts to save gas costs and space to introduce the checkpointing, token amounts are limited to `uint192`. This should not pose a problem for any token, but as `uint192` supports a _very_ large range of numbers, but the TokenWrapper will stop accepting deposits once if it hits `2^192 - 1`.
