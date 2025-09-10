use rand::Rng;
use std::fs;
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

pub static DICTIONARY_VEC: OnceLock<Vec<String>> = OnceLock::new();

pub fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

pub fn load_dictionary(path: &str) {
    let mut dict_vec = Vec::new();

    match fs::read_to_string(path) {
        Ok(contents) => {
            for line in contents.lines() {
                let word = line.trim().to_lowercase();
                dict_vec.push(word);
            }
            tracing::info!("Loaded {} words into dictionary", dict_vec.len());
        }
        Err(e) => {
            panic!("Failed to load dictionary from {}: {}", path, e);
        }
    }

    DICTIONARY_VEC.set(dict_vec).unwrap();
}

pub fn generate_hint_letters() -> String {
    let dict = DICTIONARY_VEC.get().expect("Dictionary not loaded");
    let mut rng = rand::rng();

    let word = &dict[rng.random_range(0..dict.len())];
    let hint_length = rng.random_range(2..=3.min(word.len()));
    let start_pos = rng.random_range(0..=word.len() - hint_length);

    word.chars().skip(start_pos).take(hint_length).collect()
}

pub fn is_valid_guess(word: &str, hint: &str) -> bool {
    let dict = DICTIONARY_VEC.get().expect("Dictionary not loaded");
    let word_lc = word.to_lowercase();
    dict.contains(&word_lc) && word_lc.contains(&hint.to_lowercase())
}
