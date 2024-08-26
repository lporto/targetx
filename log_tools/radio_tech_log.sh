# Source the api_utils.sh script
source ./api_utils.sh

# Function to monitor data radio technology changes and log results to MongoDB and console
monitor_radio_tech() {
	clear
    echo "Monitoring data radio technology changes..."
    logcat -c  # Clear the logcat buffer
    logcat -v time -T 1 -b radio | while IFS= read -r line; do
        # Check if the line contains TelephonyDisplayInfo
        if echo "$line" | grep -q "TelephonyDisplayInfo"; then
		# Extract the current network and overrideNetwork from the log line
		current_network=$(echo "$line" | grep -oP '(?<=to TelephonyDisplayInfo \{network=)[^,]+')
		current_overrideNetwork=$(echo "$line" | grep -oP '(?<=overrideNetwork=)[^,]+' | tail -1)

		# Determine the technology to log
		if [ "$current_overrideNetwork" != "NONE" ]; then
		    tech="$current_network ($current_overrideNetwork)"
		else
		    tech="$current_network"
		fi

		# Log the detected change
		echo "Data radio tech changed to: $tech"

		# Log to MongoDB
		timestamp=$(date +%s%N)
		log_data="{\"timestamp\": $timestamp, \"event\": \"radio_tech\", \"value\": \"$tech\"}"
		
		# Remove newline characters from log_data
		log_data=$(echo "$log_data" | sed ':a;N;$!ba;s/\n//g')

		# Log to API
		log_data "$log_data"
	fi
    done
}

monitor_radio_tech
