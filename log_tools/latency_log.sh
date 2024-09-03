# Source the api_utils.sh script
source ./api_utils.sh

NETWORK_INTERFACE="rmnet0"
#NETWORK_INTERFACE="wlp0s20f3"
DESTINATION="8.8.8.8"

# Function to run ping test and log results to MongoDB and console
run_ping_test() {
    clear
    echo "Running Ping Test..."

    while true; do

        ping -c 60 -I $NETWORK_INTERFACE $DESTINATION | while IFS= read -r line; do
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

            # Capture and log packet error rate from the summary line
            if echo "$line" | grep -q "packet loss"; then
                packet_loss=$(echo "$line" | grep -oP '\d+(?=% packet loss)')
                timestamp=$(date +%s%N)
                log_data="{\"timestamp\": $timestamp, \"event\": \"packet_error_rate\", \"value\": \"$packet_loss%\"}"
                
                # Log to API
                log_data "$log_data"
                
                # Show packet error rate on console
                echo "Packet Error Rate: $packet_loss%"
            fi
        done
    done
}

run_ping_test
