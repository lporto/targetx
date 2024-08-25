#!/bin/bash

# Name of the tmux session
SESSION_NAME="targetx"

# Collection name passed as an argument
COLLECTION_NAME="$1"

# Start a new tmux session in detached mode
tmux new-session -d -s $SESSION_NAME

# Split the window horizontally into two equal halves
tmux split-window -v

# Split the top half into two horizontal panes
tmux select-pane -t 0
tmux split-window -v

# Split the bottom half into two horizontal panes
tmux select-pane -t 2
tmux split-window -v

# Run the scripts in each pane
tmux send-keys -t $SESSION_NAME:0.0 "bash bandwidth_log.sh $COLLECTION_NAME" C-m
tmux send-keys -t $SESSION_NAME:0.1 "bash latency_log.sh $COLLECTION_NAME" C-m
tmux send-keys -t $SESSION_NAME:0.2 "bash radio_state_log.sh $COLLECTION_NAME" C-m
tmux send-keys -t $SESSION_NAME:0.3 "bash radio_tech_log.sh $COLLECTION_NAME" C-m

# Attach to the tmux session
tmux attach-session -t $SESSION_NAME

