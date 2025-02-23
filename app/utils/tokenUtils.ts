export async function fetchTokenPrices(tokens, setPrices) {
    let prices = {};
    for (let token of tokens) {
        prices[token] = Math.random() * 10; // Placeholder, replace with real API call
    }
    setPrices(prices);
}

export async function fetchTokenLogos(tokens, setLogos) {
    let logos = {};
    for (let token of tokens) {
        logos[token] = `https://tokens.com/${token}.png`; // Placeholder, replace with real API
    }
    setLogos(logos);
}
