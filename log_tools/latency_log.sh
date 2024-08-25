# Source the api_utils.sh script
source ./api_utils.sh

NETWORK_INTERFACE="rmnet0"
#NETWORK_INTERFACE="wlp0s20f3"
DESTINATION="8.8.8.8"

# Function to run ping test and log results to MongoDB and console
run_ping_test() {
    echo "Running Ping Test..."
    ping -I $NETWORK_INTERFACE $DESTINATION | while IFS= read -r line; do
        if echo "$line" | grep -q "time="; then
            # Extract the latency value
            latency=$(echo "$line" | grep -oP 'time=\K[0-9.]+')
            timestamp=$(date +%s%N)
            log_data="{\"timestamp\": $timestamp, \"event\": \"latency\", \"value\": \"$latency ms\"}"
            
            # Log to API
            log_data "$log_data"
            
            # Show event on console
            echo "Latency: $latency ms"
        fi
    done
}

run_ping_test
