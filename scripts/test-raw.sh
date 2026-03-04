#!/bin/bash
# Capture raw stream-json output to debug the format
export CLAUDECODE=""

echo "=== Capturing raw stream-json output ==="
claude -p "List 3 files in ~/.claude/skills/ using ls command" \
  --output-format stream-json \
  --verbose \
  --model haiku \
  --dangerously-skip-permissions \
  --no-session-persistence \
  > /tmp/raw_stream.txt 2>/tmp/raw_stream_err.txt

echo "Exit code: $?"
echo ""
echo "=== Raw stdout (first 3000 chars) ==="
head -c 3000 /tmp/raw_stream.txt
echo ""
echo ""
echo "=== Stderr ==="
cat /tmp/raw_stream_err.txt
echo ""
echo "=== Line count ==="
wc -l /tmp/raw_stream.txt
