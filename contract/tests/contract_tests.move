#[test_only]
module contract::contract_tests;
use contract::Game;

const ENotImplemented: u64 = 0;




#[test]
fun test_add(){
    let value = Game::add(1, 2);
    assert!(value==3,0)

}
#[test]
fun test_contract() {
    // pass
}

#[test, expected_failure(abort_code = ::contract::contract_tests::ENotImplemented)]
fun test_contract_fail() {
    abort ENotImplemented
}
