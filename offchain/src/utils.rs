use std::collections::HashSet;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

pub fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

pub fn load_dictionary() -> HashSet<String> {
    let mut dict = HashSet::new();

    let sample_words = vec![
        "the",
        "them",
        "there",
        "these",
        "then",
        "they",
        "when",
        "where",
        "other",
        "rather",
        "either",
        "whether",
        "father",
        "mother",
        "brother",
        "gather",
        "leather",
        "weather",
        "feather",
        "teacher",
        "preacher",
        "header",
        "thread",
        "breath",
        "health",
        "wealth",
        "stealth",
        "earth",
        "north",
        "south",
        "mouth",
        "youth",
        "truth",
        "booth",
        "smooth",
        "tooth",
        "growth",
        "length",
        "strength",
        "warmth",
        "fourth",
        "their",
        "think",
        "thing",
        "through",
        "three",
        "throw",
        "theory",
        "theater",
        "therapy",
        "thermal",
        "thunder",
        "thousand",
        "thread",
        "threat",
        "throne",
        "throughout",
        "although",
        "within",
        "without",
        "everything",
        "something",
        "nothing",
        "anything",
        "everyone",
        "someone",
    ];

    for word in sample_words {
        dict.insert(word.to_string());
    }

    dict
}

pub fn generate_hint_letters() -> String {
    const COMMON_PAIRS: &[&str] = &[
        "th", "he", "in", "er", "an", "ed", "nd", "to", "en", "ti", "es", "or", "te", "of", "be",
        "ha", "as", "hi", "on", "se", "at", "ar", "re", "it", "ng", "al", "st", "le", "is", "ou",
    ];

    use rand::Rng;
    let mut rng = rand::rng();
    COMMON_PAIRS[rng.random_range(0..COMMON_PAIRS.len())].to_string()
}

pub fn contains_all_letters(word: &str, hint_letters: &str) -> bool {
    hint_letters.chars().all(|ch| word.contains(ch))
}
