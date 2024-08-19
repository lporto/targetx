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

# Function to monitor data radio technology changes and log results to MongoDB and console
monitor_radio_tech() {
    echo -e "${YELLOW}Monitoring data radio technology changes...${RESET}"
    adb logcat -c  # Clear the logcat buffer
    adb logcat -v time -T 1 -b radio | while IFS= read -r line; do
        if echo "$line" | grep -q "mRilDataRadioTechnology="; then
            # Extract the current data radio technology from the log line
            current_tech=$(echo "$line" | grep -oP 'mRilDataRadioTechnology=\K\d+')
            case $current_tech in
                0)
                    tech="UNKNOWN"
                    ;;
                1)
                    tech="GPRS (2G)"
                    ;;
                2)
                    tech="EDGE (2G)"
                    ;;
                3)
                    tech="UMTS (3G)"
                    ;;
                4)
                    tech="IS95A (2G)"
                    ;;
                5)
                    tech="IS95B (2G)"
                    ;;
                6)
                    tech="1xRTT (2G)"
                    ;;
                7)
                    tech="EVDO_0 (3G)"
                    ;;
                8)
                    tech="EVDO_A (3G)"
                    ;;
                9)
                    tech="HSDPA (3G)"
                    ;;
                10)
                    tech="HSUPA (3G)"
                    ;;
                11)
                    tech="HSPA (3G)"
                    ;;
                12)
                    tech="EVDO_B (3G)"
                    ;;
                13)
                    tech="EHRPD (3G)"
                    ;;
                14)
                    tech="LTE (4G)"
                    ;;
                15)
                    tech="HSPAP (3G)"
                    ;;
                16)
                    tech="GSM (2G - voice only)"
                    ;;
                17)
                    tech="TD_SCDMA (3G)"
                    ;;
		18)
                    tech="IWLAN"
                    ;;
    		19)
                    tech="LTE_CA"
                    ;;
		20)
                    tech="NR(New Radio) 5G"
                    ;;
                *)
                    tech="Unknown (${current_tech})"
                    ;;
            esac
            echo -e "${CYAN}Data radio tech changed to: $tech${RESET}"

            # Log to MongoDB
            timestamp=$(date +%s%N)
            log_data="{\"timestamp\": $timestamp, \"event\": \"radio_tech\", \"value\": \"$tech\"}"
	    
	    # Remove newline characters from log_data
            log_data=$(echo "$log_data" | sed ':a;N;$!ba;s/\n//g')
            insert_to_mongo "$log_data"
        fi
    done
}

monitor_radio_tech
