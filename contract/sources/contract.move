
module contract::Game {

    use std::string;
    use sui::balance::{Balance};
    use sui::sui::SUI;

    struct Player has key, store {
        id: UID,
        address: address,
        score: u64,
        escrow: Escrow, // Each player locks some SUI
    }

    struct Escrow has key, store {
        id: UID,
        balance: Balance<SUI>,   // Amount locked by the player
    }

    struct GameRoom has key, store {
        id: UID,
        creator: address,
        entry_fee: u64,
        players: vector<address>,
        active: bool,
        rounds: u64,
    }

    struct ScoreBoard has key, store {
        id: UID,
        game_id: UID,
        scores: Table<address, u64>,
        winner: option::Option<address>,    // Winner's address if decided
    }


    /// Create a new game room along with an empty scoreboard
    public fun create_game_room(creator: &signer, entry_fee: u64, rounds: u64): (GameRoom, ScoreBoard) {
        // Create the GameRoom object
        let game_id = new(creator);
        let game_room = GameRoom {
            id: game_id,
            creator: signer::address_of(creator),
            entry_fee,
            rounds,
            active: true,
            players: vector::empty(),
        };

        // Create empty scoreboard for this game
        let scoreboard_id = new(creator);
        let scores_table = Table::new();
        let scoreboard = ScoreBoard {
            id: scoreboard_id,
            game_id,
            scores: scores_table,
            winner: option::none<address>(),
        };

        (game_room, scoreboard)
    }

    /// Join a game by locking SUI in escrow and registering the player
    public fun join_game(player: &signer, game_room: &mut GameRoom, scoreboard: &mut ScoreBoard, deposit: Coin<SUI>): Escrow {
        // Ensure the game is active
        assert!(game_room.active, 1);

        // Ensure player hasn't joined yet
        let addr = signer::address_of(player);
        assert!(!vector::contains(&game_room.players, &addr), 2);

        // Ensure deposit equals entry_fee
        let deposit_amount = coin::value(&deposit);
        assert!(deposit_amount == game_room.entry_fee, 3);

        // Convert Coin<SUI> to Balance<SUI> to lock in escrow
        let balance = coin::into_balance(deposit);

        // Create Escrow object
        let escrow_id = new(player);
        let escrow = Escrow {
            id: escrow_id,
            balance,
        };

        // Register player in GameRoom
        vector::push_back(&mut game_room.players, addr);

        // Initialize player's score in ScoreBoard
        add(&mut scoreboard.scores, addr, 0);

        escrow
    }


    /// Update a player's score after backend validation
    public fun update_score(
        scoreboard: &mut ScoreBoard,
        player_addr: address,
        points: u64
    ) {
        // Ensure player exists
        assert!(contains(&scoreboard.scores, player_addr), 1);

        // Borrow mutable reference to player's current score
        let score_ref = borrow_mut(&mut scoreboard.scores, player_addr);
        *score_ref = *score_ref + points;
    }

    /// Finalize game: determine winner and distribute escrow balances
    public fun finalize_game(
        game_room: &mut GameRoom,
        scoreboard: &mut ScoreBoard,
        escrows: &vector<Escrow>,
        caller: &signer
    ) {
        // Only creator can finalize
        let caller_addr = signer::address_of(caller);
        assert!(caller_addr == game_room.creator, 2);

        // Ensure game is active
        assert!(game_room.active, 3);

        // Find winner (highest score)
        let mut max_score: u64 = 0;
        let mut winner_addr: option::Option<address> = option::none();

        let player_list = &game_room.players;
        let len = vector::length(player_list);
        let mut i = 0;
        while (i < len) {
            let addr = *vector::borrow(player_list, i);
            let player_score = *borrow_mut(&mut scoreboard.scores, addr);
            if (player_score > max_score) {
                max_score = player_score;
                winner_addr = option::some(addr);
            };
            i = i + 1;
        }

        // Transfer all escrow balances to winner
        if (option::is_some(&winner_addr)) {
            let winner = option::extract(winner_addr);

            let len_escrows = vector::length(escrows);
            let mut j = 0;
            while (j < len_escrows) {
                let escrow = vector::borrow(escrows, j);
                let coins: Coin<SUI> = coin::from_balance(escrow.balance);
                transfer::transfer(coins, winner);
                j = j + 1;
            }

            // Update ScoreBoard winner
            scoreboard.winner = option::some(winner);
        }

        // Mark game inactive
        game_room.active = false;
    }
}
