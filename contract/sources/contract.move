/// Module: contract
module contract::Game;

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

public struct Candidate has key {
    id: UID,
    image: u64,
    vote_countk: u64,
}


public fun add(a: u64, b: u64): u64{
    a+b
}
