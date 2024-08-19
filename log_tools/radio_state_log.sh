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


# Function to monitor 4G network state changes using adb logcat with radio logs
monitor_radio_state() {
    echo -e "${YELLOW}Monitoring radio state...${RESET}"
    adb logcat -c  # Clear the logcat buffer
    adb logcat -v time -T 1 -b radio | while IFS= read -r line; do
        if echo "$line" | grep -q "getDataConnectionState apnType=default ret=DISCONNECTED"; then
	    timestamp=$(date +%s%N)
            log_data="{\"timestamp\": $timestamp, \"event\": \"data conn\", \"value\": \"disconnected\"}"
            echo -e "${RED}Data disconnect detected.${RESET}"
            connected_reported=false
        elif echo "$line" | grep -q "getDataConnectionState apnType=default ret=CONNECTED"; then
            if [ "$connected_reported" = false ]; then
	    	timestamp=$(date +%s%N)
            	log_data="{\"timestamp\": $timestamp, \"event\": \"data conn\", \"value\": \"connected\"}"
                echo -e "${GREEN}Data reconnected detected.${RESET}"
                connected_reported=true
                return
            fi
        fi
    done
}

monitor_radio_state
