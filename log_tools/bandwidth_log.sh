# MongoDB connection details
MONGO_URI="mongodb+srv://example.mongodb.net/"
DATABASE="exampledb"
COLLECTION="examplecollection"
USERNAME="user"
PASSWORD="pass"

# Function to insert data into MongoDB using mongosh
insert_to_mongo() {
    local json_data=$1
    mongosh "$MONGO_URI" --quiet --username $USERNAME --password $PASSWORD --eval "use $DATABASE;" --eval "db.$COLLECTION.insertOne($json_data)" 
}


# Variables
#IPERF_SERVER="vin.proof.ovh.us"  # Replace with your iperf3 server IP or hostname
IPERF_SERVER="iperf3.moji.fr"  # Replace with your iperf3 server IP or hostname
IPERF_PORT=5207                     # Replace with your iperf3 server port if different
IPERF_OPTIONS="-u -b 0 -t 0"             # Replace with any other iperf3 options you need (e.g., "-u -b 0" for unlimited UDP bandwidth)
RECONNECT_DELAY=5                   # Delay before attempting to reconnect (seconds)

# Function to run iperf3 test with automatic reconnection and log results to MongoDB and console
run_iperf3_test() {
    clear
    echo "Running iperf3 Test..."
    while true; do
        echo "Starting iperf3 client..."
        stdbuf -oL iperf3 -c $IPERF_SERVER -p $IPERF_PORT $IPERF_OPTIONS | while IFS= read -r line; do
            if echo "$line" | grep -q "sec"; then
                # Extract the bandwidth value (in bits/sec)
                bandwidth=$(echo "$line" | grep -oP '\d+(?:\.\d+)?\s+[MKG]bits/sec' | grep -oP '^\d+(?:\.\d+)?')

                # Extract the unit (Mbits/sec, Kbits/sec, Gbits/sec)
                unit=$(echo "$line" | grep -oP '[MKG]bits/sec')

                # Combine the value and the unit
                bandwidth_value="$bandwidth $unit"

                timestamp=$(date +%s%N)
                log_data="{\"timestamp\": $timestamp, \"event\": \"bandwidth\", \"value\": \"$bandwidth_value\"}"

                # Log to MongoDB
#                insert_to_mongo "$log_data"

                # Show event on console
                echo "Bandwidth: $bandwidth_value"
            fi
        done

        echo "iperf3 disconnected, retrying in $RECONNECT_DELAY seconds..."
        sleep $RECONNECT_DELAY
    done 
}

run_iperf3_test

