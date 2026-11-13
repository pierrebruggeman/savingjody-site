#!/bin/bash
# Deploy from Cloud Shell: bash d
cd "$(dirname "$0")"
firebase deploy --only hosting --project savingjody --non-interactive
echo DEPLOY_EXIT=$?
