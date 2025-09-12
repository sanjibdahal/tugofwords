module contract::Game;

use std::string;
use sui::balance::Balance;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::table::{Self, Table};

// use sui::balance::{Balance};
// use sui::sui::SUI;
// use sui::table::{Table, add, borrow_mut, contains};
// use std::vector;
// use std::option;
// use sui::coin;
// use sui::signer;

public struct Player has key, store, drop {
    id: sui::object::UID,
    name: string::String,
    addr: address,
    score: u64,
    escrow: Escrow,
}

public struct Escrow has key, store, drop {
    id: sui::object::UID,
    owner: address,
    balance: Balance<SUI>,
}

public struct GameRoom has key, store {
    id: sui::object::UID,
    creator: address,
    entry_fee: u64,
    players: vector<Player>,
    active: bool,
    rounds: u64,
    rounds_played: u64,
}

public struct ScoreBoard has key, store {
    id: sui::object::UID,
    game_id: sui::object::ID,
    scores: Table<address, u64>,
    winner: option::Option<address>,
}

/// Create a new game room along with an empty scoreboard
public fun create_game_room(
    ctx: &mut sui::tx_context::TxContext,
    entry_fee: u64,
    rounds: u64,
): (GameRoom, ScoreBoard) {
    let game_room = GameRoom {
        id: sui::object::new(ctx),
        creator: sui::tx_context::sender(ctx),
        entry_fee,
        rounds,
        rounds_played: 0,
        active: true,
        players: vector::empty(),
    };
    let scoreboard = ScoreBoard {
        id: sui::object::new(ctx),
        game_id: sui::object::id(&game_room),
        scores: table::new(ctx),
        winner: option::none(),
    };
    (game_room, scoreboard)
}

public fun create_escrow(ctx: &mut sui::tx_context::TxContext, deposit: Coin<SUI>): Escrow {
    let balance = coin::into_balance(deposit);
    let escrow_id = sui::object::new(ctx);
    Escrow {
        id: escrow_id,
        owner: sui::tx_context::sender(ctx),
        balance,
    }
}

public fun release_escrow(ctx: &mut sui::tx_context::TxContext, mut escrows: vector<Escrow>, winner: address) {
    while (!vector::is_empty(&escrows)) {
        let Escrow { id, owner: _, balance } = vector::pop_back(&mut escrows);
        let coins = coin::from_balance(balance, ctx);
        transfer::public_transfer(coins, winner);
        sui::object::delete(id);
    };
}

/// Join a game by locking SUI in escrow and registering the player
public fun join_game(
    ctx: &mut sui::tx_context::TxContext,
    game_room: &mut GameRoom,
    scoreboard: &mut ScoreBoard,
    deposit: Coin<SUI>,
    name: string::String,
): Player {
    assert!(game_room.active, 1);
    let player_addr = sui::tx_context::sender(ctx);
    let len = vector::length(&game_room.players);
    let mut i = 0;
    while (i < len) {
        let p = vector::borrow(&game_room.players, i);
        if (p.addr == player_addr) {
            assert!(false, 2);
        };
        i = i + 1;
    };
    let deposit_amount = coin::value(&deposit);
    assert!(deposit_amount == game_room.entry_fee, 3);
    let escrow = create_escrow(ctx, deposit);
    let player_obj = Player {
        id: sui::object::new(ctx),
        addr: player_addr,
        name,
        score: 0,
        escrow,
    };
    vector::push_back(&mut game_room.players, player_obj);
    table::add(&mut scoreboard.scores, player_addr, 0);
    vector::borrow(&game_room.players, len);
    player_obj
}

/// Update a player's score after backend validation
public fun update_score(
    game_room: &mut GameRoom,
    scoreboard: &mut ScoreBoard,
    player_addr: address,
    points: u64,
) {
    let len = vector::length(&game_room.players);
    let mut i = 0;
    while (i < len) {
        let p = vector::borrow_mut(&mut game_room.players, i);
        if (p.addr == player_addr) {
            p.score = p.score + points;
            break;
        };
        i = i + 1;
    };
    if (table::contains(&scoreboard.scores, player_addr)) {
        let score_ref = table::borrow_mut(&mut scoreboard.scores, player_addr);
        *score_ref = *score_ref + points;
    };
}

/// Finalize game: determine winner and distribute escrow balances
public fun finalize_game(
    game_room: &mut GameRoom,
    scoreboard: &mut ScoreBoard,
    ctx: &mut sui::tx_context::TxContext,
) {
    let caller_addr = sui::tx_context::sender(ctx);
    assert!(caller_addr == game_room.creator, 2);
    assert!(game_room.active, 3);
    assert!(game_room.rounds_played >= game_room.rounds, 3);
    let mut max_score = 0;
    let mut winner_addr = option::none();
    let mut escrows = vector::empty();
    let len = vector::length(&game_room.players);
    let mut i = 0;
    while (i < len) {
        let p = vector::pop_back(&mut game_room.players);
        if (p.score > max_score) {
            max_score = p.score;
            winner_addr = option::some(p.addr);
        };
        let Player { id: player_id, name: _, addr: _, score: _, escrow: p_escrow } = p;
        vector::push_back(&mut escrows, p_escrow);
        sui::object::delete(player_id);
        i = i + 1;
    };
    if (option::is_some(&winner_addr)) {
        let winner = option::extract(&mut winner_addr);
        release_escrow(ctx, escrows, winner);
        scoreboard.winner = option::some(winner);
    };
    game_room.active = false;
}
