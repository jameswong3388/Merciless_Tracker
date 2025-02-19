import re
from collections import defaultdict

# Constants
DATA_PATH = '../Part A Dataset/Data_3.txt'
TOKEN_PATTERN = r'<\/*s>|\w+'


def read_training_sentences(file_path):
    """Read and parse training sentences from data file"""
    with open(file_path, 'r') as f:
        lines = [line.strip() for line in f if line.strip()]

    training_sentences = []
    in_training = False

    for line in lines:
        if line.startswith('Training Corpus'):
            in_training = True
            continue
        if line.startswith('Calculate sentence probability'):
            in_training = False
        if in_training and not line.startswith('~'):
            tokens = re.findall(TOKEN_PATTERN, line)
            training_sentences.append(tokens)
    return training_sentences


def calculate_bigram_stats(sentences):
    """Calculate bigram and unigram counts from sentences"""
    bigram_counts = defaultdict(int)
    word_counts = defaultdict(int)

    for sentence in sentences:
        for i in range(len(sentence) - 1):
            current_word, next_word = sentence[i], sentence[i + 1]
            bigram_counts[(current_word, next_word)] += 1
        for word in sentence:
            word_counts[word] += 1

    return bigram_counts, word_counts, len(word_counts)


def calculate_probability(bigrams, bigram_counts, word_counts, vocab_size, smoothing=False):
    """Calculate bigram probability with optional Laplace smoothing"""
    probability = 1.0
    print(f"\nCalculating {'smoothed' if smoothing else 'unsmoothed'} probabilities:")

    for idx, (current_word, next_word) in enumerate(bigrams, 1):
        bigram_count = bigram_counts.get((current_word, next_word), 0)
        current_count = word_counts.get(current_word, 0)

        if smoothing:
            numerator = bigram_count + 1
            denominator = current_count + vocab_size
            smoothing_note = " + 1" if bigram_count == 0 else ""
        else:
            numerator = bigram_count
            denominator = current_count or 1  # Prevent division by zero
            smoothing_note = ""

        prob = numerator / denominator
        probability *= prob

        print(
            f"Bigram {idx}: {current_word} → {next_word}\n"
            f"  Count({current_word}, {next_word}) = {bigram_count}{smoothing_note if smoothing else ''}\n"
            f"  Count({current_word}) = {current_count}{f' + {vocab_size}' if smoothing else ''}\n"
            f"  P({next_word}|{current_word}) = {numerator}/{denominator} = {prob:.4f}\n"
            f"  Cumulative Probability = {probability:.6f}\n"
        )

    return probability


# Main processing
training_data = read_training_sentences(DATA_PATH)
bigram_counts, word_counts, vocab_size = calculate_bigram_stats(training_data)

# Process test sentence
test_sentence = "<s> I read a different book by Danielle </s>"
test_tokens = re.findall(TOKEN_PATTERN, test_sentence)
test_bigrams = list(zip(test_tokens, test_tokens[1:]))

print("Test sentence:", test_sentence)
print("Identified bigrams:", test_bigrams)

# Calculate probabilities
unsmoothed = calculate_probability(test_bigrams, bigram_counts, word_counts, vocab_size)
smoothed = calculate_probability(test_bigrams, bigram_counts, word_counts, vocab_size, smoothing=True)

# Output results
print(f"Unsmoothed Bigram Probability: {unsmoothed:.6f} (≈ {unsmoothed})")
print(f"Smoothed (Laplace) Bigram Probability: {smoothed:.6e} (≈ {smoothed})")