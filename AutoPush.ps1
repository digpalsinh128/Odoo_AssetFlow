$commits = @(
    @{ Time = "14:00:00"; Hash = "8cba229"; Name = "Feature 7 (Maintenance)" },
    @{ Time = "15:00:00"; Hash = "5ae8641"; Name = "Feature 8 (Audits)" },
    @{ Time = "16:00:00"; Hash = "fed7ef2"; Name = "Feature 9 (Reports)" },
    @{ Time = "16:30:00"; Hash = "07ed2bd"; Name = "Feature 10 (Activity Logs)" }
)

Write-Host "Starting Auto-Pusher for the remaining 4 features..."
Write-Host "Leave this window open! The script will wait and push each feature at the exact hour."
Write-Host ""

foreach ($commit in $commits) {
    $targetTime = Get-Date $commit.Time
    $now = Get-Date

    if ($now -lt $targetTime) {
        $sleepSeconds = [math]::Round(($targetTime - $now).TotalSeconds)
        Write-Host "[$($now.ToString('HH:mm:ss'))] Waiting for $($commit.Time) to push $($commit.Name)... (Sleeping for $sleepSeconds seconds)"
        Start-Sleep -Seconds $sleepSeconds
    }

    $pushTime = Get-Date -Format "HH:mm:ss"
    Write-Host "[$pushTime] Pushing $($commit.Name) (commit $($commit.Hash)) to GitHub..."
    
    # Push to feature/identity-allocation branch
    git push origin "$($commit.Hash):refs/heads/feature/identity-allocation"
    
    Write-Host "Push successful!`n"
}

Write-Host "All remaining features successfully pushed! You are done for the day. 🎉"
