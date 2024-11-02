#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    # Read each line from the .env file and export it
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found!"
fi
