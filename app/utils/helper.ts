// app/utils/helper.ts

export const fetchTokenIconGraphQL = async (contractAddress: string): Promise<string | null> => {
  try {
    // Normalize the address to lowercase (the API may require it)
    const normalizedAddress = contractAddress.toLowerCase();
    const query = `
      query TokenData($address: String!) {
        token(address: $address) {
          logoUrl
        }
      }
    `;
    const variables = { address: normalizedAddress };

    const response = await fetch("https://scan.mypinata.cloud/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, variables })
    });
    
    // This error may occur if the endpoint has CORS issues or is unreachable.
    if (!response.ok) {
      console.error(`Failed to fetch token data for "${contractAddress}" - HTTP status: ${response.status}`);
      return null;
    }
    
    const json = await response.json();
    console.log("GraphQL response for token", contractAddress, json);
    
    if (json.data && json.data.token && json.data.token.logoUrl) {
      return json.data.token.logoUrl;
    } else {
      console.error(`No logoUrl found for token ${contractAddress}`, json);
      return null;
    }
  } catch (error) {
    console.error(`GraphQL error fetching token icon for "${contractAddress}":`, error);
    return null;
  }
};
