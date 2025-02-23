// app/utils/tokenLogos.ts

export const fetchTokenLogos = async (
    availableTokens: string[],
    setTokenLogos: (logos: Record<string, string>) => void
  ) => {
    try {
      // Map over the tokens to create an array of promises for fetching each token's logo.
      const logoPromises = availableTokens.map(async (token) => {
        try {
          // Fetch data from CoinGecko. Ensure that the token identifier you pass here
          // matches what CoinGecko expects (it might be an id like "bitcoin" rather than a contract address).
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${token.toLowerCase()}`
          );
          const data = await response.json();
          // Return an object with the token and the retrieved logo URL (or an empty string if not found)
          return { token, logo: data.image?.large || "" };
        } catch (error) {
          console.error(`Error fetching logo for ${token}:`, error);
          // Return empty string if there is an error for this token
          return { token, logo: "" };
        }
      });
  
      // Wait for all the logo fetch promises to complete.
      const results = await Promise.all(logoPromises);
  
      // Create an object mapping tokens to their logo URLs.
      const logos: Record<string, string> = results.reduce((acc, { token, logo }) => {
        acc[token] = logo;
        return acc;
      }, {} as Record<string, string>);
  
      // Finally, update the state with the logos.
      setTokenLogos(logos);
    } catch (error) {
      console.error("Error in fetchTokenLogos:", error);
    }
  };
  