import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ShamirSecretReconstructor {

    // A simple inner class to hold the (x, y) coordinates of a share.
    private static class Share {
        final int x;
        final int y;

        Share(int x, int y) {
            this.x = x;
            this.y = y;
        }

        @Override
        public String toString() {
            return "Share(" + x + ", " + y + ")";
        }
    }

    public static void main(String[] args) {
        // The JSON data provided in the problem.
        String jsonInput = """
        {
            "keys": {
                "n": 4,
                "k": 3
            },
            "1": {
                "base": "10",
                "value": "4"
            },
            "2": {
                "base": "2",
                "value": "111"
            },
            "3": {
                "base": "10",
                "value": "12"
            },
            "6": {
                "base": "4",
                "value": "213"
            }
        }
        """;

        try {
            // 1. Parse the JSON to extract the shares and the threshold 'k'.
            JSONObject json = new JSONObject(jsonInput);
            int k = json.getJSONObject("keys").getInt("k");
            
            List<Share> shares = new ArrayList<>();
            // Iterate over all keys in the JSON object.
            for (String key : json.keySet()) {
                // A key is a share if it can be parsed as a number.
                if (key.matches("\\d+")) {
                    JSONObject shareData = json.getJSONObject(key);
                    int x = Integer.parseInt(key);
                    String value = shareData.getString("value");
                    int base = Integer.parseInt(shareData.getString("base"));
                    
                    // Decode the value from its given base into a standard base-10 integer.
                    int y = Integer.parseInt(value, base);
                    shares.add(new Share(x, y));
                }
            }

            System.out.println("Successfully decoded " + shares.size() + " shares:");
            shares.forEach(System.out::println);
            System.out.println("Threshold (k) required for reconstruction: " + k);

            // 2. Select the first 'k' shares for reconstruction.
            if (shares.size() < k) {
                System.out.println("Not enough shares to reconstruct the secret!");
                return;
            }
            List<Share> sharesForReconstruction = shares.subList(0, k);

            // 3. Reconstruct the secret using the selected shares.
            long secret = reconstructSecret(sharesForReconstruction);
            System.out.println("\n✅ The reconstructed secret is: " + secret);

        } catch (Exception e) {
            System.err.println("An error occurred: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Reconstructs the secret from a list of shares using Lagrange Interpolation.
     * The secret is the value of the polynomial at x=0.
     *
     * @param shares A list of at least 'k' shares.
     * @return The reconstructed secret.
     */
    public static long reconstructSecret(List<Share> shares) {
        double secret = 0.0;
        int k = shares.size();

        // This implements the Lagrange Interpolation formula to find P(0)
        // P(0) = Σ [yj * Π (xi / (xi - xj))] for i != j
        for (int j = 0; j < k; j++) {
            double y_j = shares.get(j).y;
            double lagrangeTerm = 1.0;

            for (int i = 0; i < k; i++) {
                if (i == j) {
                    continue; // Skip when i equals j
                }
                
                double x_i = shares.get(i).x;
                double x_j = shares.get(j).x;

                // Calculate the Lagrange basis polynomial L_j(0)
                lagrangeTerm *= x_i / (x_i - x_j);
            }
            secret += y_j * lagrangeTerm;
        }

        // Round the result to the nearest long to account for potential floating-point inaccuracies.
        return Math.round(secret);
    }
}