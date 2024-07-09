#!/bin/bash

# Using Solidty compiler from Linux Packages -> https://docs.soliditylang.org/en/latest/installing-solidity.html#linux-packages
# Solc 0.8.26

if [ $# -ne 1 ]; then
    echo "Usage: $0 <contract_file>"
    exit 1
fi

CONTRACT_FILE=$1
OUTPUT_DIR="outputs"

BASENAME=$(basename "$CONTRACT_FILE" .sol)

echo "Compiling $CONTRACT_FILE"
echo "-> generating ABI, BIN, and JSON"
echo "-> compiling to '$OUTPUT_DIR'"

solc --optimize --bin --abi --combined-json abi --pretty-json --evm-version=paris --overwrite "$CONTRACT_FILE" -o "$OUTPUT_DIR"

if [ $? -eq 0 ]; then
    mv "$OUTPUT_DIR/combined.json" "$OUTPUT_DIR/$BASENAME.json"
    echo "Compilation successful!"
else
    echo "Error: Compilation failed."
fi
