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

# Function to run ping test and log results to MongoDB and console
run_ping_test() {
    echo -e "${BLUE}Running Ping Test...${RESET}"
    ping -I $NETWORK_INTERFACE -c 120 $DESTINATION | while IFS= read -r line; do
        if echo "$line" | grep -q "time="; then
            # Extract the latency value
            latency=$(echo "$line" | grep -oP 'time=\K[0-9.]+')
            timestamp=$(date +%s%N)
            log_data="{\"timestamp\": $timestamp, \"event\": \"latency\", \"value\": \"$latency ms\"}"
            
            # Log to MongoDB
            insert_to_mongo "$log_data"
            
            # Show event on console
            echo -e "${GREEN}Latency: $latency ms${RESET}"
        fi
    done
}

# Example usage
NETWORK_INTERFACE="enx0e3b0b3c40d0"
DESTINATION="8.8.8.8"
run_ping_test

