#!/bin/bash

# Load environment variables from .env file
load_env() {
    if [ -f .env ]; then
        export $(cat .env | xargs)
    else
        echo ".env file not found!"
        exit 1
    fi
}

# Function to obtain JWT Token
get_jwt_token() {
    local login_url="$API_URL/api/login"
    response=$(curl -k -s -X POST $login_url \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

    # Extract the token from the response
    jwt_token=$(echo $response | jq -r '.token')

    if [ "$jwt_token" == "" ]; then
        echo "Error: Could not obtain JWT token. Please check your credentials."
        exit 1
    fi
}

# Load environment variables
load_env

# Set collection from the first command-line argument, if provided
if [ -n "$1" ]; then
    COLLECTION="$1"
fi

# Function to log data to the API
log_data() {
    local data="$1"
    local api_url="$API_URL/api/datapoints/$COLLECTION"

    response=$(curl -k -s -X POST $api_url \
    -H "Authorization: Bearer $jwt_token" \
    -H "Content-Type: application/json" \
    -d "$data")

    # Check if the post was successful
    if echo "$response" | grep -q '"error":'; then
        echo "Error posting data point: $response"
    fi
}

# Obtain JWT Token
get_jwt_token