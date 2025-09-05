/**
 * Main function to find the correct secret and identify a corrupt share.
 */
function main() {
  // JSON input where share "3" is deliberately wrong (value is 999 instead of 12).
  const jsonInputWithFault = {
    keys: {
      n: 10,
      k: 7,
    },
    1: {
      base: "6",
      value: "13444211440455345511",
    },
    2: {
      base: "15",
      value: "aed7015a346d635",
    },
    3: {
      base: "15",
      value: "6aeeb69631c227c",
    },
    4: {
      base: "16",
      value: "e1b5e05623d881f",
    },
    5: {
      base: "8",
      value: "316034514573652620673",
    },
    6: {
      base: "3",
      value: "2122212201122002221120200210011020220200",
    },
    7: {
      base: "3",
      value: "20120221122211000100210021102001201112121",
    },
    8: {
      base: "6",
      value: "20220554335330240002224253",
    },
    9: {
      base: "12",
      value: "45153788322a1255483",
    },
    10: {
      base: "7",
      value: "1101613130313526312514143",
    },
  };

  try {
    // 1. Parse all available shares.
    const { shares: allShares, k } = parseShares(jsonInputWithFault);

    console.log(
      `Attempting reconstruction with ${allShares.length} shares (threshold k=${k})`
    );
    allShares.forEach((share) =>
      console.log(`Share(x: ${share.x}, y: ${share.y})`)
    );

    if (allShares.length < k) {
      throw new Error("Not enough shares to reconstruct the secret!");
    }

    // 2. Generate all combinations of 'k' shares.
    const combinations = generateCombinations(allShares, k);
    const secretCounts = new Map();
    const successfulCombinations = new Map();

    // 3. Reconstruct a secret for each combination and count the results.
    for (const combo of combinations) {
      const secret = reconstructSecret(combo);
      secretCounts.set(secret, (secretCounts.get(secret) || 0) + 1);
      if (!successfulCombinations.has(secret)) {
        successfulCombinations.set(secret, combo);
      }
    }

    // 4. Find the secret that occurred most frequently.
    let correctSecret = null;
    let maxCount = 0;
    for (const [secret, count] of secretCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        correctSecret = secret;
      }
    }

    // 5. Identify the corrupt share by finding which one was excluded.
    if (correctSecret !== null) {
      console.log(`\n✅ Correct secret found: ${correctSecret}`);

      const goodShares = new Set(
        successfulCombinations.get(correctSecret).map((s) => JSON.stringify(s))
      );
      const corruptShare = allShares.find(
        (s) => !goodShares.has(JSON.stringify(s))
      );

      if (corruptShare) {
        console.log(
          `🚨 Faulty share detected: Share(x: ${corruptShare.x}, y: ${corruptShare.y})`
        );
      } else {
        console.log("No single corrupt share found.");
      }
    } else {
      throw new Error("Could not determine a consistent secret.");
    }
  } catch (error) {
    console.error("❌ An error occurred:", error.message);
  }
}

// --- Helper Functions ---

/**
 * Parses the raw JSON object into an array of shares and extracts the threshold 'k'.
 */
function parseShares(jsonData) {
  const k = jsonData.keys.k;
  const shares = [];
  for (const key in jsonData) {
    if (!isNaN(parseInt(key, 10))) {
      const shareData = jsonData[key];
      const x = parseInt(key, 10);
      const y = parseInt(shareData.value, parseInt(shareData.base, 10));
      shares.push({ x, y });
    }
  }
  return { shares, k };
}

/**
 * Reconstructs the secret from a list of shares using Lagrange Interpolation.
 */
function reconstructSecret(shares) {
  let secret = 0.0;
  const k = shares.length;
  for (let j = 0; j < k; j++) {
    let term = shares[j].y;
    for (let i = 0; i < k; i++) {
      if (i === j) continue;
      term *= shares[i].x / (shares[i].x - shares[j].x);
    }
    secret += term;
  }
  return Math.round(secret);
}

/**
 * Generates all combinations of size 'k' from an array of elements.
 */
function generateCombinations(elements, k) {
  const result = [];
  function combinatorics(startIndex, currentCombo) {
    if (currentCombo.length === k) {
      result.push([...currentCombo]);
      return;
    }
    for (let i = startIndex; i < elements.length; i++) {
      currentCombo.push(elements[i]);
      combinatorics(i + 1, currentCombo);
      currentCombo.pop();
    }
  }
  combinatorics(0, []);
  return result;
}

// Run the main function
main();
