# Source the api_utils.sh script
source ./api_utils.sh

# Function to monitor 4G network state changes using adb logcat with radio logs
monitor_radio_state() {
    clear
    echo "Monitoring radio state..."
    logcat -c  # Clear the logcat buffer
    # Initialize the connection state assuming its connected
    connected_reported=true
    stdbuf -oL logcat -v time -T 1 -b radio | while IFS= read -r line; do
        if echo "$line" | grep -q "DataRegState=1"; then
            if [ "$connected_reported" = true ]; then
                timestamp=$(date +%s%N)
                log_data="{\"timestamp\": $timestamp, \"event\": \"data conn\", \"value\": \"disconnected\"}"
                echo "Data disconnect detected."
                connected_reported=false
	        fi
        elif echo "$line" | grep -q "DataRegState=0"; then
            if [ "$connected_reported" = false ]; then
	        	timestamp=$(date +%s%N)
            	log_data="{\"timestamp\": $timestamp, \"event\": \"data conn\", \"value\": \"connected\"}"
                echo "Data reconnected detected."
                connected_reported=true
            fi
        fi
        # Log to API
        log_data "$log_data"
    done
}

monitor_radio_state
